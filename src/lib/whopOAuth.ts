/**
 * Whop OAuth 2.1 + PKCE helpers for the SPA flow.
 *
 * Flow:
 *   1. Generate code_verifier + state, store in sessionStorage
 *   2. Compute code_challenge = SHA-256(code_verifier)
 *   3. Redirect to Whop authorize URL
 *   4. On callback, read ?code= and ?state= from URL
 *   5. Verify state, send code + code_verifier to backend
 *   6. Backend exchanges for access token, returns BOVYN JWT
 */

const STORAGE_KEY_VERIFIER = "bovyn.whop_verifier";
const STORAGE_KEY_STATE = "bovyn.whop_state";

/** Generate a cryptographically random string of given length. */
function randomString(length: number): string {
  const bytes = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0"))
    .join("")
    .slice(0, length);
}

/** Base64url-encode a buffer (no padding). */
function base64url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let str = "";
  for (const b of bytes) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Compute SHA-256 hash and return as base64url. */
async function sha256Base64url(plain: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return base64url(hash);
}

export interface PKCEParams {
  codeVerifier: string;
  codeChallenge: string;
  state: string;
}

/** Generate PKCE parameters and store verifier + state in sessionStorage. */
export async function generatePKCE(): Promise<PKCEParams> {
  const codeVerifier = randomString(64);
  const codeChallenge = await sha256Base64url(codeVerifier);
  const state = randomString(32);

  sessionStorage.setItem(STORAGE_KEY_VERIFIER, codeVerifier);
  sessionStorage.setItem(STORAGE_KEY_STATE, state);

  return { codeVerifier, codeChallenge, state };
}

/** Retrieve stored PKCE verifier + state. Returns null if missing. */
export function getStoredPKCE(): { codeVerifier: string; state: string } | null {
  const codeVerifier = sessionStorage.getItem(STORAGE_KEY_VERIFIER);
  const state = sessionStorage.getItem(STORAGE_KEY_STATE);
  if (!codeVerifier || !state) return null;
  return { codeVerifier, state };
}

/** Clear stored PKCE data after use. */
export function clearPKCE(): void {
  sessionStorage.removeItem(STORAGE_KEY_VERIFIER);
  sessionStorage.removeItem(STORAGE_KEY_STATE);
}

/** Build the full Whop OAuth authorization URL. */
export function buildWhopAuthorizeURL(params: {
  clientId: string;
  redirectUri: string;
  codeChallenge: string;
  state: string;
  companyId?: string;
}): string {
  const url = new URL("https://api.whop.com/oauth/authorize");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", params.clientId);
  url.searchParams.set("redirect_uri", params.redirectUri);
  url.searchParams.set("scope", "openid profile email");
  url.searchParams.set("state", params.state);
  url.searchParams.set("nonce", randomString(16));
  url.searchParams.set("code_challenge", params.codeChallenge);
  url.searchParams.set("code_challenge_method", "S256");
  if (params.companyId) {
    url.searchParams.set("company_id", params.companyId);
  }
  return url.toString();
}

/** Check if the current URL has OAuth callback params (?code=&state=). */
export function getOAuthCallbackParams(): { code: string; state: string } | null {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const state = params.get("state");
  if (!code || !state) return null;
  return { code, state };
}

/** Remove OAuth params from the URL bar without reload. */
export function cleanOAuthParams(): void {
  const url = new URL(window.location.href);
  url.searchParams.delete("code");
  url.searchParams.delete("state");
  url.searchParams.delete("error");
  url.searchParams.delete("error_description");
  window.history.replaceState({}, "", url.pathname);
}
