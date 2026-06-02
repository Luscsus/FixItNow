import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useForgotPasswordMutation } from "@/hooks/useForgotPasswordMutation";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";

function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
      <path d="M1 5l7 4.5L15 5" />
    </svg>
  );
}

export function ForgotPasswordPage() {
  const { t } = useTranslation();
  const forgotMutation = useForgotPasswordMutation();

  const forgotSchema = z.object({
    email: z.string().email(t("forgotPassword.enterValidEmail")),
  });

  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"email", string>>>({});
  const [serverError, setServerError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const canSubmit = email.trim() !== "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;

    const parsed = forgotSchema.safeParse({ email: email.trim() });
    if (!parsed.success) { setErrors(mapZodErrors(parsed.error)); return; }
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
      <div className="auth-art">
        <div className="auth-art-grid" />
        <Link to="/" className="auth-brand-inv">
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", gap: 40, position: "relative", zIndex: 1, marginTop: 56 }}>
          <div>
            <p className="crumbs" style={{ color: "rgba(255,255,255,0.45)", marginBottom: 20 }}>
              {t("forgotPassword.accountRecovery")}
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4.4vw,62px)" }}>
              {t("forgotPassword.lockedOut")}<br />
              <span style={{ color: "var(--amber-500)" }}>{t("forgotPassword.out")}</span><br />
              {t("forgotPassword.letsGetBack")}
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>{t("forgotPassword.feature01")}</b> {t("forgotPassword.feature01body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>{t("forgotPassword.feature02")}</b> {t("forgotPassword.feature02body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>{t("forgotPassword.feature03")}</b> {t("forgotPassword.feature03body")}</span>
            </div>
            <div className="feature-divider" />
          </div>

          <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 12, padding: "16px 20px", fontSize: 13, lineHeight: 1.55, color: "rgba(255,255,255,0.7)" }}>
            {t("forgotPassword.securityNote")}
          </div>
        </div>

        <div className="auth-meta">
          <div><b>≤ 60s</b><br />{t("forgotPassword.avgDelivery")}</div>
          <div><b>1h</b><br />{t("forgotPassword.resetLinkValidity")}</div>
          <div><b>SSL</b><br />{t("forgotPassword.sslEncrypted")}</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form">
          {submitted ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--emerald-100, #d1fae5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">{t("forgotPassword.checkYourEmail")}</h2>
              <p className="body muted" style={{ maxWidth: 320 }}>
                {t("forgotPassword.emailSentIfExists", { email })}
              </p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                {t("forgotPassword.backToSignIn")}
              </Link>
              <button type="button" onClick={() => setSubmitted(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 13, color: "var(--navy-700)", fontWeight: 500, padding: 0 }}>
                {t("forgotPassword.tryDifferentEmail")}
              </button>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 32 }}>
                <p className="crumbs">
                  <Link to="/login" style={{ color: "inherit", textDecoration: "none" }}>{t("forgotPassword.signIn")}</Link>
                  <span className="sep">/</span>
                  {t("forgotPassword.forgotPasswordBreadcrumb")}
                </p>
                <h2 className="h1">{t("forgotPassword.resetYourPassword")}</h2>
                <p className="body muted" style={{ marginTop: 4 }}>{t("forgotPassword.resetDescription")}</p>
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
                <div className="field">
                  <label className="field-label" htmlFor="forgot-email">{t("forgotPassword.emailAddress")}</label>
                  <div className={`input-wrap${errors.email ? " error" : ""}`}>
                    <IconMail />
                    <input id="forgot-email" className="input" type="email" placeholder={t("forgotPassword.emailPlaceholder")} autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!canSubmit || forgotMutation.isPending} style={{ marginTop: 4 }}>
                  {forgotMutation.isPending ? t("forgotPassword.sendingResetLink") : t("forgotPassword.sendResetLink")}
                </button>

                <div style={{ textAlign: "center", fontSize: 13, color: "var(--text-muted)", marginTop: 4 }}>
                  {t("forgotPassword.rememberedIt")}{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    {t("forgotPassword.backToSignInLink")}
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
