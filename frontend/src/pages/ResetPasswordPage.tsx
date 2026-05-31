import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { z } from "zod";

import { useResetPasswordMutation } from "@/hooks/useResetPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { PasswordInput } from "@/components/ui/PasswordInput";

const resetSchema = z.object({
  token: z.string().min(1, "Reset token is required."),
  newPassword: z.string().min(8, "Password must be at least 8 characters."),
});

function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="8" r="4" />
      <path d="M10 8h5M13 6v4" />
    </svg>
  );
}

function passwordStrength(pw: string): number {
  if (pw.length === 0) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";

  const resetMutation = useResetPasswordMutation();

  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<
    Partial<Record<"token" | "newPassword" | "confirmPassword", string>>
  >({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  // Keep token in sync if the URL param changes (e.g. user re-clicks a fresh
  // link from a second email — rare, but harmless).
  useEffect(() => {
    if (urlToken && urlToken !== token) {
      setToken(urlToken);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlToken]);

  const tokenFromUrl = Boolean(urlToken);
  const pwStrength = passwordStrength(newPassword);
  const canSubmit = token.trim() !== "" && newPassword.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords don't match." });
      return;
    }

    const parsed = resetSchema.safeParse({
      token: token.trim(),
      newPassword,
    });
    if (!parsed.success) {
      setErrors(mapZodErrors(parsed.error));
      return;
    }
    setErrors({});
    setServerError("");

    try {
      await resetMutation.mutateAsync(parsed.data);
      setSuccess(true);
      // Auto-redirect to login after a short moment so the success state is visible.
      window.setTimeout(() => navigate("/login"), 2500);
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
              Almost there
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4.4vw,62px)" }}>
              Pick a<br />
              <span style={{ color: "var(--amber-500)" }}>new password</span><br />
              and you're in.
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody">
                <b>Make it strong.</b> 8+ characters with a mix of upper, lower,
                digit, and symbol.
              </span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody">
                <b>Don't reuse old ones.</b> A password manager handles the
                memory work for you.
              </span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody">
                <b>You'll stay signed in.</b> Other active sessions are
                revoked for security.
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
            Reset links are single-use and valid for one hour. After that you
            can always request a new one from the sign-in page.
          </div>
        </div>

        <div className="auth-meta">
          <div><b>1h</b><br />link validity</div>
          <div><b>Single</b><br />-use token</div>
          <div><b>SSL</b><br />encrypted</div>
        </div>
      </div>

      {/* Right form panel */}
      <div className="auth-form-side">
        <div className="auth-form">
          {success ? (
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
              <h2 className="h1">Password updated</h2>
              <p className="body muted" style={{ maxWidth: 320 }}>
                Your password has been reset. Redirecting you to sign in…
              </p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                Go to sign in →
              </Link>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 28 }}>
                <p className="crumbs">
                  <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>Sign in</Link>
                  <span className="sep">/</span>
                  Reset password
                </p>
                <h2 className="h1">Choose a new password</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  {tokenFromUrl
                    ? "Your reset link is verified. Pick a new password below."
                    : "Paste the reset token from your email, then choose a new password."}
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
                {/* Only show the token input if the URL didn't supply one —
                    otherwise it's already filled in and there's no reason to
                    re-paste it. We keep it as a hidden value either way. */}
                {!tokenFromUrl && (
                  <div className="field">
                    <label className="field-label" htmlFor="reset-token">Reset token</label>
                    <div className={`input-wrap${errors.token ? " error" : ""}`}>
                      <IconKey />
                      <input
                        id="reset-token"
                        className="input"
                        placeholder="Paste the token from your email"
                        value={token}
                        onChange={(e) => setToken(e.target.value)}
                        autoComplete="one-time-code"
                        spellCheck={false}
                        style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }}
                      />
                    </div>
                    {errors.token && <span className="field-error">{errors.token}</span>}
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="reset-new-password">New password</label>
                  <PasswordInput
                    id="reset-new-password"
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    autoFocus={tokenFromUrl}
                    hasError={Boolean(errors.newPassword)}
                  />
                  {newPassword && (
                    <div className={`pw-meter s${pwStrength}`}>
                      <span /><span /><span /><span />
                    </div>
                  )}
                  {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
                  <span className="field-hint">
                    At least 8 characters. Use uppercase, numbers, and symbols for a stronger password.
                  </span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reset-confirm-password">Confirm new password</label>
                  <PasswordInput
                    id="reset-confirm-password"
                    placeholder="Re-enter the new password"
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    hasError={Boolean(errors.confirmPassword)}
                  />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <button
                  type="submit"
                  className="btn btn-primary btn-full btn-lg"
                  disabled={!canSubmit || resetMutation.isPending}
                  style={{ marginTop: 4 }}
                >
                  {resetMutation.isPending ? "Updating password…" : "Reset password"}
                </button>

                <div
                  style={{
                    textAlign: "center",
                    fontSize: 13,
                    color: "var(--text-muted)",
                    marginTop: 4,
                  }}
                >
                  Didn't request this?{" "}
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
