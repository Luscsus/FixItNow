import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";

import { useConfirmEmailQuery } from "@/hooks/useConfirmEmailQuery";
import { useResendEmailConfirmationMutation } from "@/hooks/useResendEmailConfirmationMutation";
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
function IconKey() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="6" cy="8" r="4" />
      <path d="M10 8h5M13 6v4" />
    </svg>
  );
}

export function ConfirmEmailPage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialToken = searchParams.get("token") ?? "";

  const confirmSchema = z.object({ token: z.string().min(1, t("confirmEmail.tokenRequired")) });
  const resendSchema  = z.object({ email: z.string().email(t("confirmEmail.enterValidEmail")) });

  const [token, setToken] = useState(initialToken);
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Partial<Record<"token" | "email", string>>>({});
  const [serverError, setServerError] = useState("");
  const [resendSuccess, setResendSuccess] = useState("");
  const autoConfirmedRef = useRef<string | null>(null);

  const confirmQuery = useConfirmEmailQuery(token.trim());
  const resendMutation = useResendEmailConfirmationMutation();

  const isBusy = confirmQuery.isFetching;
  const confirmed = Boolean(confirmQuery.data);

  const confirmWithToken = async (t2: string) => {
    const parsed = confirmSchema.safeParse({ token: t2.trim() });
    if (!parsed.success) { setErrors(mapZodErrors(parsed.error)); return; }
    setErrors({});
    setServerError("");
    try {
      await confirmQuery.refetch();
    } catch (error) {
      setServerError(getErrorMessage(error));
    }
  };

  useEffect(() => {
    if (!initialToken) return;
    setToken(initialToken);
  }, [initialToken]);

  useEffect(() => {
    const trimmed = token.trim();
    if (!initialToken || !trimmed || trimmed !== initialToken.trim()) return;
    if (autoConfirmedRef.current === trimmed) return;
    autoConfirmedRef.current = trimmed;
    void confirmWithToken(trimmed);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialToken, token]);

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    await confirmWithToken(token);
  };

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = resendSchema.safeParse({ email: email.trim() });
    if (!parsed.success) { setErrors((prev) => ({ ...prev, ...mapZodErrors(parsed.error) })); return; }
    setErrors((prev) => ({ ...prev, email: undefined }));
    setResendSuccess("");
    try {
      const res = await resendMutation.mutateAsync(parsed.data);
      setResendSuccess(res?.text || t("confirmEmail.resendConfirmationEmail"));
    } catch (error) {
      setErrors((prev) => ({ ...prev, email: getErrorMessage(error) }));
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
              {t("confirmEmail.optionalStep")}
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(38px,4.4vw,62px)" }}>
              {t("confirmEmail.getYour")}<br />
              <span style={{ color: "var(--amber-500)" }}>{t("confirmEmail.verified")}</span><br />
              {t("confirmEmail.badge")}
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>{t("confirmEmail.feature01")}</b> {t("confirmEmail.feature01body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>{t("confirmEmail.feature02")}</b> {t("confirmEmail.feature02body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>{t("confirmEmail.feature03")}</b> {t("confirmEmail.feature03body")}</span>
            </div>
            <div className="feature-divider" />
          </div>
        </div>

        <div className="auth-meta">
          <div><b>4,200+</b><br />{t("confirmEmail.verifiedProviders")}</div>
          <div><b>98%</b><br />{t("confirmEmail.satisfactionRate")}</div>
          <div><b>2h</b><br />{t("confirmEmail.avgResponseTime")}</div>
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form">
          {confirmed ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--emerald-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">{t("confirmEmail.emailVerified")}</h2>
              <p className="body muted">{t("confirmEmail.verifiedBadgeAdded")}</p>
              <Link to="/account" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                {t("confirmEmail.viewMyProfile")}
              </Link>
              <Link to="/login" style={{ fontSize: 13, color: "var(--navy-700)", textDecoration: "none" }}>
                {t("confirmEmail.goToSignIn")}
              </Link>
            </div>
          ) : isBusy ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--navy-50)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--navy-700)" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
                </svg>
              </div>
              <h2 className="h1">{t("confirmEmail.confirming")}</h2>
              <p className="body muted">{t("confirmEmail.verifyingToken")}</p>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 32 }}>
                <p className="crumbs">{t("confirmEmail.emailVerification")}</p>
                <h2 className="h1">{t("confirmEmail.verifyYourEmail")}</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  {t("confirmEmail.pasteTokenDescription")}{" "}
                  <Link to="/dashboard/user" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    {t("confirmEmail.skipForNow")}
                  </Link>
                </p>
              </div>

              {serverError && (
                <div style={{ background: "#FEF2F2", border: "1px solid #FECACA", borderRadius: 10, padding: "12px 14px", marginBottom: 20, fontSize: 13, color: "#DC2626", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ flexShrink: 0, marginTop: 1 }}>
                    <circle cx="8" cy="8" r="6.5" />
                    <path d="M8 5v3.5" />
                    <circle cx="8" cy="11" r=".6" fill="currentColor" stroke="none" />
                  </svg>
                  {serverError}
                </div>
              )}

              <form onSubmit={handleConfirm} className="col" style={{ gap: 20 }}>
                <div className="field">
                  <label className="field-label" htmlFor="confirm-token">{t("confirmEmail.confirmationToken")}</label>
                  <div className={`input-wrap${errors.token ? " error" : ""}`}>
                    <IconKey />
                    <input id="confirm-token" className="input" placeholder={t("confirmEmail.tokenPlaceholder")} value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" />
                  </div>
                  {errors.token && <span className="field-error">{errors.token}</span>}
                </div>
                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!token.trim() || isBusy}>
                  {t("confirmEmail.confirmEmail")}
                </button>
              </form>

              <div style={{ margin: "28px 0", borderTop: "1px solid var(--border)", paddingTop: 28 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: "var(--text)", marginBottom: 16 }}>
                  {t("confirmEmail.didntReceiveEmail")}
                </p>

                {resendSuccess ? (
                  <div style={{ background: "var(--emerald-100)", border: "1px solid #6EE7B7", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "var(--emerald-700)", display: "flex", gap: 8, alignItems: "center" }}>
                    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 8l3.5 3.5L13 4.5" />
                    </svg>
                    {resendSuccess}
                  </div>
                ) : (
                  <form onSubmit={handleResend} className="col" style={{ gap: 12 }}>
                    <div className="field">
                      <label className="field-label" htmlFor="resend-email">{t("confirmEmail.yourEmailAddress")}</label>
                      <div className={`input-wrap${errors.email ? " error" : ""}`}>
                        <IconMail />
                        <input id="resend-email" className="input" type="email" placeholder={t("confirmEmail.emailPlaceholder")} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
                      </div>
                      {errors.email && <span className="field-error">{errors.email}</span>}
                    </div>
                    <button type="submit" className="btn btn-secondary btn-full" disabled={!email.trim() || resendMutation.isPending}>
                      {resendMutation.isPending ? t("confirmEmail.sending") : t("confirmEmail.resendConfirmationEmail")}
                    </button>
                  </form>
                )}
              </div>

              <Link to="/login" style={{ fontSize: 13, color: "var(--text-muted)", textDecoration: "none" }}>
                {t("confirmEmail.backToSignIn")}
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
