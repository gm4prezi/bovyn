/**
 * LoginScreen — Whop OAuth primary + email/password fallback.
 *
 * Primary: "Continue with Whop" → OAuth PKCE flow → auto-verified.
 * Fallback: Enter email + create password / sign in.
 *
 * First-time Whop subscribers hit "Continue with Whop", get auto-verified
 * with their subscription tier. No password needed.
 */
import { useState, useCallback, type FormEvent } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  KeyRound,
  Loader2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Logo } from "../components/ui/Logo";
import { cn } from "../lib/cn";
import { fetchWhopConfig } from "../lib/bovynApi";
import {
  generatePKCE,
  buildWhopAuthorizeURL,
} from "../lib/whopOAuth";

type Step = "landing" | "email" | "password";
type Intent = "create" | "login";

export function LoginScreen() {
  const { login, signup, loggingIn, error, whopCallbackInProgress } = useAuth();

  const [step, setStep] = useState<Step>("landing");
  const [intent, setIntent] = useState<Intent>("create");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);
  const [whopLoading, setWhopLoading] = useState(false);

  const trimmedEmail = email.trim();
  const isCreate = intent === "create";

  const emailValid =
    trimmedEmail.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail);
  const passwordReady =
    password.length >= 6 && (!isCreate || confirmPw.length >= 6);

  /* ── Whop OAuth redirect ──────────────────────────── */

  const handleWhopLogin = useCallback(async () => {
    setWhopLoading(true);
    setLocalError(null);
    try {
      const config = await fetchWhopConfig();
      if (!config.configured) {
        setLocalError("Whop login not available yet. Use email/password below.");
        setStep("email");
        setWhopLoading(false);
        return;
      }
      const pkce = await generatePKCE();
      const url = buildWhopAuthorizeURL({
        clientId: config.client_id,
        redirectUri: config.redirect_uri,
        codeChallenge: pkce.codeChallenge,
        state: pkce.state,
      });
      // Redirect to Whop — user will come back with ?code=&state=
      window.location.href = url;
    } catch {
      setLocalError("Couldn't connect to Whop. Try email/password instead.");
      setWhopLoading(false);
    }
  }, []);

  /* ── Email step ────────────────────────────────────── */

  function handleEmailContinue(e: FormEvent) {
    e.preventDefault();
    if (!emailValid) {
      setLocalError("Enter a valid email address.");
      return;
    }
    setLocalError(null);
    setStep("password");
  }

  function goBackToEmail() {
    setStep("email");
    setPassword("");
    setConfirmPw("");
    setLocalError(null);
  }

  /* ── Password submit ───────────────────────────────── */

  async function handlePasswordSubmit(e: FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (password.length < 6) {
      setLocalError("Password must be at least 6 characters.");
      return;
    }
    if (isCreate && password !== confirmPw) {
      setLocalError("Passwords don't match.");
      return;
    }
    try {
      if (isCreate) await signup(trimmedEmail, password);
      else await login(trimmedEmail, password);
    } catch { /* AuthContext handles */ }
  }

  function switchIntent() {
    setIntent((i) => (i === "create" ? "login" : "create"));
    setPassword("");
    setConfirmPw("");
    setLocalError(null);
  }

  const displayError = localError || error;

  // Show spinner while OAuth callback is in progress
  if (whopCallbackInProgress) {
    return (
      <div className="min-h-[100dvh] bg-bg text-cream flex flex-col items-center justify-center gap-4">
        <Logo size="lg" />
        <Loader2 className="h-6 w-6 animate-spin text-amber" />
        <p className="text-sm text-fog font-light">Verifying your Whop account...</p>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-bg text-cream relative overflow-hidden">
      {/* Ambient gradient */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(240,160,32,0.10) 0%, transparent 60%), radial-gradient(ellipse 60% 40% at 100% 100%, rgba(240,160,32,0.04) 0%, transparent 60%)",
        }}
      />

      <main className="relative mx-auto flex min-h-[100dvh] w-full max-w-md flex-col items-center justify-center px-6 py-10" style={{ paddingTop: "max(2.5rem, calc(2.5rem + var(--sat)))" }}>
        <div className="w-full">
          {/* ── Brand ────────────────────────────────── */}
          <div className="mb-8 flex flex-col items-center text-center">
            <Logo size="lg" className="mb-3" />
            {step === "landing" && (
              <>
                <h1 className="font-display text-xl font-medium text-cream tracking-tight mt-1">
                  Welcome to Bovyn
                </h1>
                <p className="mt-2 text-xs text-fog font-light leading-relaxed max-w-[300px]">
                  Connect your Whop subscription for instant access with your tier.
                </p>
              </>
            )}
            {step === "email" && (
              <>
                <h1 className="font-display text-xl font-medium text-cream tracking-tight mt-1">
                  {isCreate ? "Set up your account" : "Sign in"}
                </h1>
                <p className="mt-2 text-xs text-fog font-light leading-relaxed max-w-[280px]">
                  Enter the email you used on Whop.
                </p>
              </>
            )}
            {step === "password" && isCreate && (
              <>
                <h1 className="font-display text-xl font-medium text-cream tracking-tight mt-1">
                  Create your password
                </h1>
                <p className="mt-2 text-xs text-fog font-light">
                  For <span className="text-amber font-medium">{trimmedEmail}</span>
                </p>
              </>
            )}
            {step === "password" && !isCreate && (
              <>
                <h1 className="font-display text-xl font-medium text-cream tracking-tight mt-1">
                  Welcome back
                </h1>
                <p className="mt-2 text-xs text-fog font-light">
                  <span className="text-amber font-medium">{trimmedEmail}</span>
                </p>
              </>
            )}
          </div>

          {/* ── Landing: Whop OAuth primary ──────────── */}
          {step === "landing" && (
            <div className="space-y-4">
              {/* Primary: Continue with Whop */}
              <button
                onClick={handleWhopLogin}
                disabled={whopLoading}
                className="group relative flex w-full items-center justify-center gap-2.5 rounded-xl bg-amber px-4 py-4 text-sm font-semibold tracking-wide text-bg transition-all hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {whopLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Connecting to Whop...
                  </>
                ) : (
                  <>
                    <ExternalLink className="h-4 w-4" />
                    Continue with Whop
                  </>
                )}
              </button>

              {/* Info card */}
              <div className="flex items-start gap-2.5 rounded-xl border border-amber/10 bg-amber/[0.03] px-3.5 py-3">
                <KeyRound className="h-4 w-4 text-amber/60 flex-shrink-0 mt-0.5" />
                <p className="text-[11px] text-fog/70 leading-relaxed">
                  Instantly verifies your subscription and sets your access tier.
                  No password needed.
                </p>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="flex-1 h-px bg-white/[0.06]" />
                <span className="text-[10px] font-mono font-bold tracking-[0.15em] text-fog/30 uppercase">
                  or
                </span>
                <div className="flex-1 h-px bg-white/[0.06]" />
              </div>

              {/* Fallback: email/password */}
              <button
                onClick={() => setStep("email")}
                className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-4 py-3.5 text-sm font-medium text-cream/70 transition-all hover:border-white/[0.15] hover:text-cream"
              >
                Use email & password
              </button>

              {displayError && <ErrorBanner message={displayError} />}

              <p className="text-center text-[11px] text-fog/50 pt-2">
                Don't have a subscription?{" "}
                <a
                  href="https://whop.com/bovyn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber hover:text-amber/80 underline underline-offset-2"
                >
                  Subscribe on Whop
                </a>
              </p>
            </div>
          )}

          {/* ── Step: Email ──────────────────────────── */}
          {step === "email" && (
            <form onSubmit={handleEmailContinue} className="space-y-4">
              <button
                type="button"
                onClick={() => { setStep("landing"); setLocalError(null); }}
                className="inline-flex items-center gap-1.5 text-[12px] text-fog hover:text-cream transition-colors mb-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back</span>
              </button>

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-fog"
                >
                  Whop Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  autoFocus
                  spellCheck={false}
                  placeholder="you@email.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setLocalError(null); }}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-cream placeholder:text-fog/40 outline-none transition-colors focus:border-amber/50 focus:bg-white/[0.05]"
                />
              </div>

              {displayError && <ErrorBanner message={displayError} />}

              <button
                type="submit"
                disabled={!emailValid}
                className="group relative flex w-full items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3.5 text-sm font-semibold tracking-wide text-bg transition-all hover:bg-amber/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </button>

              <div className="text-center pt-2">
                <p className="text-[12px] text-fog/60">
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => { setIntent("login"); if (emailValid) setStep("password"); }}
                    className="text-amber hover:text-amber/80 underline underline-offset-2"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </form>
          )}

          {/* ── Step: Password ───────────────────────── */}
          {step === "password" && (
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <button
                type="button"
                onClick={goBackToEmail}
                className="inline-flex items-center gap-1.5 text-[12px] text-fog hover:text-cream transition-colors mb-1"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Change email</span>
              </button>

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-fog"
                >
                  {isCreate ? "Create a password" : "Password"}
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete={isCreate ? "new-password" : "current-password"}
                  autoFocus
                  placeholder={isCreate ? "6+ characters" : "Enter your password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setLocalError(null); }}
                  disabled={loggingIn}
                  className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-cream placeholder:text-fog/40 outline-none transition-colors focus:border-amber/50 focus:bg-white/[0.05] disabled:opacity-60"
                />
              </div>

              {isCreate && (
                <div>
                  <label
                    htmlFor="confirm-pw"
                    className="mb-2 block text-[11px] font-semibold uppercase tracking-wider text-fog"
                  >
                    Confirm password
                  </label>
                  <input
                    id="confirm-pw"
                    name="confirm-pw"
                    type="password"
                    autoComplete="new-password"
                    placeholder="Re-enter password"
                    value={confirmPw}
                    onChange={(e) => { setConfirmPw(e.target.value); setLocalError(null); }}
                    disabled={loggingIn}
                    className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3.5 text-sm text-cream placeholder:text-fog/40 outline-none transition-colors focus:border-amber/50 focus:bg-white/[0.05] disabled:opacity-60"
                  />
                </div>
              )}

              {displayError && <ErrorBanner message={displayError} />}

              <button
                type="submit"
                disabled={!passwordReady || loggingIn}
                className={cn(
                  "group relative flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-sm font-semibold tracking-wide transition-all disabled:cursor-not-allowed disabled:opacity-50",
                  "bg-amber text-bg hover:bg-amber/90"
                )}
              >
                {loggingIn ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {isCreate ? "Setting up..." : "Signing in..."}
                  </>
                ) : isCreate ? (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Get Started
                  </>
                ) : (
                  <>
                    <ShieldCheck className="h-4 w-4" />
                    Sign In
                  </>
                )}
              </button>

              <div className="text-center pt-1">
                <p className="text-[12px] text-fog/60">
                  {isCreate ? (
                    <>
                      Already have an account?{" "}
                      <button type="button" onClick={switchIntent} className="text-amber hover:text-amber/80 underline underline-offset-2">
                        Sign in instead
                      </button>
                    </>
                  ) : (
                    <>
                      First time here?{" "}
                      <button type="button" onClick={switchIntent} className="text-amber hover:text-amber/80 underline underline-offset-2">
                        Create your password
                      </button>
                    </>
                  )}
                </p>
              </div>
            </form>
          )}

          {/* Footer for email/password steps */}
          {step !== "landing" && (
            <div className="mt-8 text-center">
              <p className="text-[11px] text-fog/50">
                Don't have a subscription?{" "}
                <a
                  href="https://whop.com/bovyn/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-amber hover:text-amber/80 underline underline-offset-2"
                >
                  Subscribe on Whop
                </a>
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/[0.06] px-3.5 py-2.5 text-[12px] text-red-300">
      {message}
    </div>
  );
}
