import { useGoogleLogin } from "@react-oauth/google";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { z } from "zod";

import { useAuth } from "@/context/auth";
import type { AuthSession } from "@/domain/auth";
import { useLoginMutation } from "@/hooks/useLoginMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

import { googleLogin } from "@/services/authService";
import { mapZodErrors } from "@/lib/validation";

const GOOGLE_ENABLED = Boolean(import.meta.env.VITE_GOOGLE_CLIENT_ID);

/** Isolated so useGoogleLogin is only called when the OAuth provider is mounted. */
function GoogleLoginButton({
  onError,
}: {
  onError: (msg: string) => void;
}) {
  const { setSession } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setLoading(true);
      try {
        const result = await googleLogin(tokenResponse.access_token);
        setSession(result, true);
        if (result.role === "ADMIN") {
          navigate("/dashboard/admin/providers");
        } else if (result.role === "PROVIDER") {
          navigate("/dashboard/provider");
        } else {
          navigate("/dashboard/user");
        }
      } catch (error) {
        onError(getErrorMessage(error));
      } finally {
        setLoading(false);
      }
    },
    onError: () => onError("Google sign-in failed. Please try again."),
  });

  return (
    <button
      type="button"
      className="btn btn-secondary btn-full"
      style={{ gap: 10 }}
      onClick={() => handleGoogleLogin()}
      disabled={loading}
    >
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
        <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
        <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
        <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
      </svg>
      {loading ? "Signing in…" : "Continue with Google"}
    </button>
  );
}

const loginSchema = z.object({
  email: z.string().email("Enter a valid email."),
  password: z.string().min(1, "Password is required."),
});

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
      <path d="M1 5l7 4.5L15 5" />
    </svg>
  );
}

function IconLock() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="7" width="10" height="7" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}

export function LoginPage() {
  const navigate = useNavigate();
  const { setSession, setTempToken } = useAuth();
  const loginMutation = useLoginMutation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [keepSignedIn, setKeepSignedIn] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<"email" | "password", string>>>({});
  const [showConfirmLink, setShowConfirmLink] = useState(false);

  const canSubmit = email.trim() !== "" && password.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsed = loginSchema.safeParse({ email: email.trim(), password });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});

    let result: AuthSession;
    try {
      setShowConfirmLink(false);
      result = await loginMutation.mutateAsync(parsed.data);
    } catch (error) {
      const message = getErrorMessage(error);
      setShowConfirmLink(message.toLowerCase().includes("verify your email"));
      setErrors({ email: message });
      return;
    }

    if (result.requiresTwoFactor) {
      setTempToken(result.tempToken);
      navigate("/two-factor");
      return;
    }

    // Pass keepSignedIn — when false the session lives in sessionStorage and
    // gets wiped when the browser/tab closes.
    setSession(result, keepSignedIn);
    if (result.role === "ADMIN") {
      navigate("/dashboard/admin/providers");
    } else if (result.role === "PROVIDER") {
      navigate("/dashboard/provider");
    } else {
      navigate("/dashboard/user");
    }
  };

  return (
    <div className="auth">
      {/* Left art panel */}
      <div className="auth-art">
        <div className="auth-art-grid" />

        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 32, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              Your maintenance marketplace
            </p>
            <h1 className="display" style={{ color: "#fff" }}>
              Something's<br />
              <span style={{ color: "var(--amber-500)" }}>broken.</span><br />
              Let's fix it.
            </h1>
          </div>

          <div className="col gap-4" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>Report in seconds.</b> Describe the problem and let AI route it to the right trade.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>Track in real time.</b> Get updates at every step, from quote to completion.</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>Pay with confidence.</b> Funds release only when the job is done right.</span>
            </div>
            <div className="feature-divider" />
          </div>

          {/* Quote */}
          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "20px 24px",
            position: "relative",
            zIndex: 1,
          }}>
            <p style={{ fontSize: 14, color: "rgba(255,255,255,0.8)", lineHeight: 1.6, margin: 0, fontStyle: "italic" }}>
              "We had a burst pipe at 11pm. FixItNow had a certified plumber on-site within the hour. Incredible."
            </p>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.45)", marginTop: 10, fontFamily: "var(--font-mono)", letterSpacing: "0.04em" }}>
              — SARA K. · VERIFIED USER
            </p>
          </div>
        </div>

        <div className="auth-meta">
          <div><b>4,200+</b><br />verified providers</div>
          <div><b>98%</b><br />satisfaction rate</div>
          <div><b>2h</b><br />avg. response time</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-form">
          <div className="col" style={{ gap: 8, marginBottom: 32 }}>
            <p className="crumbs">Welcome back</p>
            <h2 className="h1">Sign in to your account</h2>
            <p className="body muted" style={{ marginTop: 4 }}>
              Don't have an account?{" "}
              <Link to="/register" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                Sign up free →
              </Link>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
            <div className="field">
              <label className="field-label" htmlFor="login-email">Email address</label>
              <div className={`input-wrap${errors.email ? " error" : ""}`}>
                <IconMail />
                <input
                  id="login-email"
                  className="input"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              {errors.email && <span className="field-error">{errors.email}</span>}
              {showConfirmLink && (
                <Link
                  to="/confirm-email"
                  style={{ fontSize: 13, color: "var(--navy-700)", fontWeight: 500, textDecoration: "none", marginTop: 2 }}
                >
                  Confirm or resend email confirmation →
                </Link>
              )}
            </div>

            <div className="field">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <label className="field-label" htmlFor="login-password">Password</label>
                <Link to="/forgot-password" style={{ fontSize: 12, color: "var(--navy-700)", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </Link>
              </div>
              <div className={`input-wrap${errors.password ? " error" : ""}`}>
                <IconLock />
                <input
                  id="login-password"
                  className="input"
                  type="password"
                  placeholder="Your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {errors.password && <span className="field-error">{errors.password}</span>}
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", fontSize: 14, color: "var(--text-muted)" }}>
              <input
                type="checkbox"
                checked={keepSignedIn}
                onChange={(e) => setKeepSignedIn(e.target.checked)}
                style={{ accentColor: "var(--navy-700)", width: 15, height: 15 }}
              />
              Keep me signed in
            </label>

            <button
              type="submit"
              className="btn btn-primary btn-full btn-lg"
              disabled={!canSubmit || loginMutation.isPending}
              style={{ marginTop: 4 }}
            >
              {loginMutation.isPending ? "Signing in…" : "Sign in"}
            </button>

            <div className="divider" style={{ position: "relative" }}>
              <span style={{
                position: "absolute", top: "50%", left: "50%",
                transform: "translate(-50%, -50%)",
                background: "#fff", padding: "0 12px",
                fontSize: 12, color: "var(--text-muted)",
                fontFamily: "var(--font-mono)", letterSpacing: "0.05em",
              }}>OR</span>
            </div>

            <button
              type="button"
              className="btn btn-secondary btn-full"
              style={{ gap: 10 }}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
              </svg>
              Continue with Google
            </button>
            {GOOGLE_ENABLED ? (
              <GoogleLoginButton
                onError={(msg) => setErrors({ email: msg })}
              />
            ) : (
              <button
                type="button"
                className="btn btn-secondary btn-full"
                style={{ gap: 10 }}
                disabled
                title="Google sign-in is not configured"
              >
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4" />
                  <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853" />
                  <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05" />
                  <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335" />
                </svg>
                Continue with Google
              </button>
            )}
          </form>

        </div>
      </div>
    </div>
  );
}
