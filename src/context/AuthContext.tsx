/**
 * AuthContext — owns JWT lifecycle, license login, and derived tier.
 *
 * Flow:
 *   1. On mount: read token from localStorage. If present, push into bovynApi
 *      via setAuthToken(), then validate via fetchMe(). If fetchMe() fails
 *      with 401/invalid, clear and force re-login. Anything else → keep token
 *      (best-effort, network errors shouldn't log users out).
 *   2. login(licenseKey): POST /api/auth/login, stash token + tier, persist.
 *   3. logout(): clear token + localStorage.
 *
 * Token persistence: localStorage key "bovyn.jwt". Cleared on explicit logout
 * or on hard 401 from /api/auth/me on boot.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { Tier } from "../types";
import {
  BovynApiError,
  fetchMe,
  login as apiLogin,
  signup as apiSignup,
  whopCallback as apiWhopCallback,
  setAuthToken,
} from "../lib/bovynApi";
import {
  getOAuthCallbackParams,
  getStoredPKCE,
  clearPKCE,
  cleanOAuthParams,
} from "../lib/whopOAuth";

const STORAGE_KEY = "bovyn.jwt";

export interface AuthUser {
  tier: Tier;
  email: string | null;
  membershipId: string | null;
  planId: string | null;
  exp: number | null;
}

interface AuthState {
  /** "booting" until we've tried to restore a session from storage. */
  status: "booting" | "anonymous" | "authenticated";
  /** True while processing an OAuth callback from Whop redirect. */
  whopCallbackInProgress: boolean;
  user: AuthUser | null;
  error: string | null;
  loggingIn: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthState | null>(null);

function readStoredToken(): string | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return raw;
  } catch {
    return null;
  }
}

function writeStoredToken(token: string | null) {
  try {
    if (token) localStorage.setItem(STORAGE_KEY, token);
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable — fall through, auth still works for the session */
  }
}

/**
 * Decode a JWT payload without verifying. Used to surface `exp` + `email`
 * immediately on boot without waiting for a network round-trip.
 * Returns null if the token is malformed.
 */
function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const pad = "=".repeat((4 - (payload.length % 4)) % 4);
    const json = atob(payload + pad);
    const parsed = JSON.parse(json);
    if (parsed && typeof parsed === "object") return parsed as Record<string, unknown>;
    return null;
  } catch {
    return null;
  }
}

function userFromPayload(payload: Record<string, unknown>): AuthUser | null {
  const tier = payload.tier;
  if (
    tier !== "trial" &&
    tier !== "intel" &&
    tier !== "operator" &&
    tier !== "execute" &&
    tier !== "architect"
  ) {
    return null;
  }
  return {
    tier,
    email: typeof payload.email === "string" ? payload.email : null,
    membershipId:
      typeof payload.membership_id === "string" ? payload.membership_id : null,
    planId: typeof payload.plan_id === "string" ? payload.plan_id : null,
    exp: typeof payload.exp === "number" ? payload.exp : null,
  };
}

const FRIENDLY_ERRORS_STATIC: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  missing_email: "Enter your email address.",
  missing_password: "Enter your password.",
  password_too_short: "Password must be at least 6 characters.",
  invalid_credentials: "Wrong email or password.",
  email_already_registered: "An account with this email already exists. Log in instead.",
  whop_email_not_found: "No Whop subscription found for this email. Subscribe first.",
  subscription_inactive: "Your Whop subscription is not active. Renew to continue.",
  server_missing_whop_key: "Server misconfigured. Contact support.",
  server_missing_jwt_secret: "Server misconfigured. Contact support.",
  whop_unreachable: "Can't reach Whop right now. Try again shortly.",
  invalid_json: "Invalid request. Please try again.",
  missing_code_or_verifier: "Whop login incomplete. Please try again.",
  whop_token_exchange_failed: "Couldn't verify with Whop. Try again.",
  whop_userinfo_failed: "Couldn't get your Whop account info. Try again.",
  whop_oauth_not_configured: "Whop login not set up yet. Use email/password.",
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthState["status"]>("booting");
  const [whopCallbackInProgress, setWhopCallbackInProgress] = useState(false);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingIn, setLoggingIn] = useState(false);
  const bootedRef = useRef(false);

  // Boot: try to restore session from localStorage OR handle Whop OAuth callback
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;

    // ── DEV SCREENSHOT BYPASS (temporary) ──
    if (import.meta.env.DEV && import.meta.env.VITE_DEV_TIER) {
      setUser({ tier: import.meta.env.VITE_DEV_TIER as import("../types").Tier, email: "demo@bovyn.com", membershipId: "demo123", planId: "plan123", exp: 9999999999 });
      setStatus("authenticated");
      return;
    }

    // ── Check for Whop OAuth callback (?code=&state= in URL) ──
    const oauthParams = getOAuthCallbackParams();
    if (oauthParams) {
      const pkce = getStoredPKCE();
      cleanOAuthParams(); // Remove ?code=&state= from URL bar immediately

      if (!pkce || pkce.state !== oauthParams.state) {
        clearPKCE();
        setError("OAuth state mismatch. Please try again.");
        setStatus("anonymous");
        return;
      }

      // Exchange the code for a BOVYN JWT
      setWhopCallbackInProgress(true);
      (async () => {
        try {
          const resp = await apiWhopCallback(oauthParams.code, pkce.codeVerifier);
          clearPKCE();
          setAuthToken(resp.token);
          writeStoredToken(resp.token);
          setUser({
            tier: resp.tier,
            email: resp.email,
            membershipId: resp.membership_id,
            planId: resp.plan_id,
            exp: resp.exp,
          });
          setStatus("authenticated");
        } catch (err) {
          clearPKCE();
          const code =
            err instanceof BovynApiError && err.code ? err.code : "whop_login_failed";
          setError(FRIENDLY_ERRORS_STATIC[code] ?? `Whop login failed: ${code}`);
          setStatus("anonymous");
        } finally {
          setWhopCallbackInProgress(false);
        }
      })();
      return;
    }

    // ── Normal boot: restore session from localStorage ──
    const token = readStoredToken();
    if (!token) {
      setStatus("anonymous");
      return;
    }

    // Check client-side expiration first to avoid pointless network call
    const payload = decodeJwtPayload(token);
    if (payload) {
      const exp = payload.exp;
      if (typeof exp === "number" && exp * 1000 < Date.now()) {
        writeStoredToken(null);
        setAuthToken(null);
        setStatus("anonymous");
        return;
      }
      // Optimistically hydrate from payload while /me is in flight
      const u = userFromPayload(payload);
      if (u) setUser(u);
    }

    setAuthToken(token);

    // Verify with server. If it's a 401/403, nuke the token.
    // On network errors, keep the stored token and go authenticated — the
    // user shouldn't get kicked out because Wi-Fi blipped.
    (async () => {
      try {
        const me = await fetchMe();
        setUser({
          tier: me.tier,
          email: me.email ?? null,
          membershipId: me.membership_id ?? null,
          planId: me.plan_id ?? null,
          exp: me.exp ?? null,
        });
        setStatus("authenticated");
      } catch (err) {
        if (err instanceof BovynApiError && (err.status === 401 || err.status === 403)) {
          writeStoredToken(null);
          setAuthToken(null);
          setUser(null);
          setStatus("anonymous");
          return;
        }
        // Network error / server down — honor the stored token.
        if (payload) {
          const u = userFromPayload(payload);
          if (u) {
            setUser(u);
            setStatus("authenticated");
            return;
          }
        }
        setStatus("anonymous");
      }
    })();
  }, []);

  const FRIENDLY_ERRORS = FRIENDLY_ERRORS_STATIC;

  const handleAuthResponse = useCallback((resp: { token: string; tier: Tier; email: string | null; membership_id: string; plan_id: string; exp: number }) => {
    setAuthToken(resp.token);
    writeStoredToken(resp.token);
    setUser({
      tier: resp.tier,
      email: resp.email,
      membershipId: resp.membership_id,
      planId: resp.plan_id,
      exp: resp.exp,
    });
    setStatus("authenticated");
  }, []);

  const handleAuthError = useCallback((err: unknown) => {
    const code =
      err instanceof BovynApiError && err.code
        ? err.code
        : err instanceof Error
          ? err.message
          : "unknown_error";
    setError(FRIENDLY_ERRORS[code] ?? `Something went wrong: ${code}`);
    throw err;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoggingIn(true);
    try {
      const resp = await apiLogin(email.trim(), password);
      handleAuthResponse(resp);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoggingIn(false);
    }
  }, [handleAuthResponse, handleAuthError]);

  const signup = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoggingIn(true);
    try {
      const resp = await apiSignup(email.trim(), password);
      handleAuthResponse(resp);
    } catch (err) {
      handleAuthError(err);
    } finally {
      setLoggingIn(false);
    }
  }, [handleAuthResponse, handleAuthError]);

  const logout = useCallback(() => {
    setAuthToken(null);
    writeStoredToken(null);
    setUser(null);
    setStatus("anonymous");
    setError(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({ status, whopCallbackInProgress, user, error, loggingIn, login, signup, logout }),
    [status, whopCallbackInProgress, user, error, loggingIn, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
