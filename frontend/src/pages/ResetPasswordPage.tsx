import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useSEO } from "@/hooks/useSEO";

import { useResetPasswordMutation } from "@/hooks/useResetPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { PasswordInput } from "@/components/ui/PasswordInput";

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
  useSEO({ title: "Reset Password", robots: "noindex, nofollow" });
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const urlToken = searchParams.get("token") ?? "";

  const resetSchema = z.object({
    token: z.string().min(1, t("resetPassword.tokenRequired")),
    newPassword: z.string().min(8, t("resetPassword.passwordMinLength")),
  });

  const resetMutation = useResetPasswordMutation();

  const [token, setToken] = useState(urlToken);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"token" | "newPassword" | "confirmPassword", string>>>({});
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);

  const tokenFromUrl = Boolean(urlToken);
  const pwStrength = passwordStrength(newPassword);
  const canSubmit = token.trim() !== "" && newPassword.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: t("resetPassword.passwordsDontMatch") });
      return;
    }

    const parsed = resetSchema.safeParse({ token: token.trim(), newPassword });
    if (!parsed.success) { setErrors(mapZodErrors(parsed.error)); return; }
    setErrors({});
    setServerError("");

    try {
      await resetMutation.mutateAsync(parsed.data);
      setSuccess(true);
      window.setTimeout(() => navigate("/login"), 2500);
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  return (
    <div className="auth">
      <div className="auth-art">
        <div className="auth-art-grid" />
        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              {t("resetPassword.almostThere")}
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4.4vw,62px)" }}>
              {t("resetPassword.pickA")}<br />
              <span style={{ color: "var(--amber-500)" }}>{t("resetPassword.newPassword")}</span><br />
              {t("resetPassword.andYoureIn")}
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>{t("resetPassword.feature01")}</b> {t("resetPassword.feature01body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>{t("resetPassword.feature02")}</b> {t("resetPassword.feature02body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>{t("resetPassword.feature03")}</b> {t("resetPassword.feature03body")}</span>
            </div>
            <div className="feature-divider" />
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 20px", fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.7)" }}>
            {t("resetPassword.securityNote")}
          </div>
        </div>

        <div className="auth-meta">
          <div><b>1h</b><br />{t("resetPassword.linkValidity")}</div>
          <div><b>Single</b><br />{t("resetPassword.singleUseToken")}</div>
          <div><b>SSL</b><br />{t("resetPassword.sslEncrypted")}</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form">
          {success ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--emerald-100, #d1fae5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">{t("resetPassword.passwordUpdated")}</h2>
              <p className="body muted" style={{ maxWidth: 320 }}>{t("resetPassword.passwordResetSuccess")}</p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                {t("resetPassword.goToSignIn")}
              </Link>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 28 }}>
                <p className="crumbs">
                  <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>{t("resetPassword.signIn")}</Link>
                  <span className="sep">/</span>
                  {t("resetPassword.resetPasswordBreadcrumb")}
                </p>
                <h2 className="h1">{t("resetPassword.chooseNewPassword")}</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  {tokenFromUrl ? t("resetPassword.resetLinkVerified") : t("resetPassword.pasteResetToken")}
                </p>
              </div>

              {serverError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 5v3.5M8 11v.01" strokeLinecap="round" />
                  </svg>
                  <span>{serverError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
                {!tokenFromUrl && (
                  <div className="field">
                    <label className="field-label" htmlFor="reset-token">{t("resetPassword.resetToken")}</label>
                    <div className={`input-wrap${errors.token ? " error" : ""}`}>
                      <IconKey />
                      <input id="reset-token" className="input" placeholder={t("resetPassword.resetTokenPlaceholder")} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="one-time-code" spellCheck={false} style={{ fontFamily: "var(--font-mono)", letterSpacing: "0.02em" }} />
                    </div>
                    {errors.token && <span className="field-error">{errors.token}</span>}
                  </div>
                )}

                <div className="field">
                  <label className="field-label" htmlFor="reset-new-password">{t("resetPassword.newPasswordLabel")}</label>
                  <PasswordInput id="reset-new-password" placeholder={t("resetPassword.newPasswordPlaceholder")} autoComplete="new-password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoFocus={tokenFromUrl} hasError={Boolean(errors.newPassword)} />
                  {newPassword && (
                    <div className={`pw-meter s${pwStrength}`}>
                      <span /><span /><span /><span />
                    </div>
                  )}
                  {errors.newPassword && <span className="field-error">{errors.newPassword}</span>}
                  <span className="field-hint">{t("resetPassword.passwordHint")}</span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reset-confirm-password">{t("resetPassword.confirmNewPassword")}</label>
                  <PasswordInput id="reset-confirm-password" placeholder={t("resetPassword.confirmPasswordPlaceholder")} autoComplete="new-password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} hasError={Boolean(errors.confirmPassword)} />
                  {errors.confirmPassword && <span className="field-error">{errors.confirmPassword}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!canSubmit || resetMutation.isPending} style={{ marginTop: 4 }}>
                  {resetMutation.isPending ? t("resetPassword.updatingPassword") : t("resetPassword.resetPassword")}
                </button>

                <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {t("resetPassword.didntRequest")}{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    {t("resetPassword.backToSignIn")}
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
