import { useState } from "react";
import { Link } from "react-router-dom";
import { z } from "zod";

import { useForgotPasswordMutation } from "@/hooks/useForgotPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

const forgotSchema = z.object({
  email: z.string().email("Enter a valid email."),
});

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
      <path d="M1 5l7 4.5L15 5" />
    </svg>
  );
}

export function ForgotPasswordPage() {
  const forgotMutation = useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"email", string>>>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsed = forgotSchema.safeParse({ email: email.trim() });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setServerError("");

    try {
      await forgotMutation.mutateAsync(parsed.data);
      setSubmitted(true);
    } catch (error) {
      setServerError(getErrorMessage(error));
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

        <div style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 40,
          position: "relative",
          zIndex: 1,
          marginTop: 56,
        }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              Account recovery
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4.4vw,62px)" }}>
              Locked<br />
              <span style={{ color: "var(--amber-500)" }}>out?</span><br />
              Let's get you back in.
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody">
                <b>Enter your email.</b> The one you used to sign up.
              </span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody">
                <b>Check your inbox.</b> We'll send a one-time reset link.
              </span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody">
                <b>Pick a new password.</b> Back to fixing things in under a minute.
              </span>
            </div>
            <div className="feature-divider" />
          </div>

          <div style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: "16px 20px",
            fontSize: 13,
            lineHeight: 1.55,
            color: "rgba(255,255,255,0.7)",
          }}>
            For security, we always say "if the email exists" — even when it doesn't.
            That way nobody can use our form to fish for active accounts.
          </div>
        </div>

        <div className="auth-meta">
          <div><b>≤ 60s</b><br />average delivery</div>
          <div><b>1h</b><br />reset link validity</div>
          <div><b>SSL</b><br />end-to-end encrypted</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-form">
          {submitted ? (
            <div
              className="col"
              style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}
            >
              <div style={{
                width: 56,
                height: 56,
                borderRadius: "50%",
                background: "var(--emerald-100, #d1fae5)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">Check your email</h2>
              <p className="body muted" style={{ maxWidth: 320 }}>
                If an account exists for <strong>{email}</strong>, a password
                reset link is on its way. The link is valid for one hour.
              </p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Back to sign in →
              </Link>
              <button
                type="button"
                onClick={() => { setSubmitted(false); }}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 13,
                  color: "var(--navy-700)",
                  fontWeight: 500,
                  padding: 0,
                }}
              >
                Try a different email
              </button>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 32 }}>
                <p className="crumbs">
                  <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
                  <span className="sep">/</span>
                  Forgot password
                </p>
                <h2 className="h1">Reset your password</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  Enter the email on your account. We'll send you a link to set
                  a new password.
                </p>
              </div>

              {serverError && (
                <div
                  style={{
                    background: "#FEF2F2",
                    border: "1px solid #FECACA",
                    borderRadius: 10,
                    padding: "12px 14px",
                    marginBottom: 20,
                    fontSize: 13,
                    color: "#DC2626",
                    display: "flex",
                    gap: 8,
                    alignItems: "flex-start",
                  }}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 5v3.5M8 11v.01" strokeLinecap="round" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
                <div className="field">
                  <label className="field-label" htmlFor="forgot-email">Email address</label>
                  <div className={`input-wrap${errors.email ? " error" : ""}`}>
                    <IconMail />
                    <input
                      id="forgot-email"
                      className="input"
                      type="email"
                      placeholder="you@example.com"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      autoFocus
                    />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!canSubmit || forgotMutation.isPending}
                  style={{ marginTop: 4 }}
                >
                  {forgotMutation.isPending ? "Sending reset link…" : "Send reset link"}
                </button>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  Remembered it after all?{" "}
                  <Link
                    to="/login"
                    style={{
                      color: "var(--navy-700)",
                      fontWeight: 600,
                      textDecoration: "none",
                    }}
                  >
                    Back to sign in →
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
