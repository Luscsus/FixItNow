import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { z } from "zod";
import { useSEO } from "@/hooks/useSEO";

import { useRegisterMutation } from "@/hooks/useRegisterMutation";
import { usePublicStatsQuery } from "@/hooks/usePublicStatsQuery";
import { getErrorMessage } from "@/lib/errorMessage";
import { mapZodErrors } from "@/lib/validation";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { AuthStat } from "@/components/auth/AuthStat";

/** Compact response-time label: minutes under an hour, else trimmed hours. */
function formatResponseTime(minutes: number | null): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes}m`;
  const hours = minutes / 60;
  return `${Number.isInteger(hours) ? hours : hours.toFixed(1)}h`;
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

function IconUser() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="8" cy="5" r="3" />
      <path d="M2 14c0-3.314 2.686-6 6-6s6 2.686 6 6" />
    </svg>
  );
}
function IconMail() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="1" y="3.5" width="14" height="9" rx="1.5" />
      <path d="M1 5l7 4.5L15 5" />
    </svg>
  );
}
function IconPhone() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 2h2.5l1 3-1.5 1a8 8 0 0 0 4 4l1-1.5 3 1V13a1 1 0 0 1-1 1A11 11 0 0 1 2 3a1 1 0 0 1 1-1z" />
    </svg>
  );
}

/** Optional phone: empty, or +/digits with common separators (6–20 chars). */
const PHONE_RE = /^$|^\+?[0-9 ()./-]{6,20}$/;

type Fields = "firstName" | "lastName" | "email" | "password" | "phoneNumber";

export function RegisterUserPage() {
  useSEO({ title: "Create User Account", robots: "noindex, nofollow" });
  const { t } = useTranslation();
  const registerMutation = useRegisterMutation();
  const { data: stats, isLoading: statsLoading } = usePublicStatsQuery();

  const schema = z.object({
    firstName: z.string().min(1, t("registerUser.firstNameRequired")),
    lastName:  z.string().min(1, t("registerUser.lastNameRequired")),
    email:     z.string().email(t("registerUser.enterValidEmail")),
    password:  z.string().min(8, t("registerUser.passwordMinLength")),
    phoneNumber: z.string().max(50).regex(PHONE_RE, t("registerUser.phoneInvalid")),
  });

  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", phoneNumber: "" });
  const [errors, setErrors] = useState<Partial<Record<Fields, string>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [termsError, setTermsError] = useState(false);

  const pwStrength = passwordStrength(form.password);
  // Phone is optional, so it isn't part of the required-fields gate.
  const canSubmit =
    form.firstName.trim() !== "" &&
    form.lastName.trim() !== "" &&
    form.email.trim() !== "" &&
    form.password.trim() !== "";

  const set = (field: Fields) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (!agreedToTerms) { setTermsError(true); return; }

    const parsed = schema.safeParse({
      firstName: form.firstName.trim(),
      lastName:  form.lastName.trim(),
      email:     form.email.trim(),
      password:  form.password,
      phoneNumber: form.phoneNumber.trim(),
    });

    if (!parsed.success) { setErrors(mapZodErrors(parsed.error)); return; }
    setErrors({});

    try {
      await registerMutation.mutateAsync({
        ...parsed.data,
        phoneNumber: parsed.data.phoneNumber || undefined,
      });
      setSubmitted(true);
    } catch (error) {
      setErrors({ email: getErrorMessage(error) });
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
              {t("registerUser.forHomeowners")}
            </p>
            <h1 className="display" style={{ color: "#fff", fontSize: "clamp(42px,4.8vw,68px)" }}>
              {t("registerUser.reportIt")}<br />
              {t("registerUser.trackIt")}<br />
              <span style={{ color: "var(--amber-500)" }}>{t("registerUser.fixed")}</span>
            </h1>
          </div>

          <div className="col" style={{ gap: 0 }}>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">01</span>
              <span className="fbody"><b>{t("registerUser.feature01")}</b> {t("registerUser.feature01body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">02</span>
              <span className="fbody"><b>{t("registerUser.feature02")}</b> {t("registerUser.feature02body")}</span>
            </div>
            <div className="feature-divider" />
            <div className="feature-row">
              <span className="fnum">03</span>
              <span className="fbody"><b>{t("registerUser.feature03")}</b> {t("registerUser.feature03body")}</span>
            </div>
            <div className="feature-divider" />
          </div>
        </div>

        <div className="auth-meta">
          <AuthStat
            loading={statsLoading}
            value={stats ? stats.activeProvidersCount.toLocaleString() : null}
            label={t("registerUser.verifiedProviders")}
          />
          <AuthStat
            loading={statsLoading}
            value={stats?.averageRating != null ? `${Math.round((stats.averageRating / 5) * 100)}%` : null}
            label={t("registerUser.satisfactionRate")}
          />
          <AuthStat
            loading={statsLoading}
            value={formatResponseTime(stats?.medianResponseMinutes ?? null)}
            label={t("registerUser.avgResponseTime")}
          />
        </div>
      </div>

      <div className="auth-form-side">
        <div className="auth-form">
          {submitted ? (
            <div className="col" style={{ gap: 16, textAlign: "center", alignItems: "center", paddingTop: 40 }}>
              <div style={{ width: 56, height: 56, borderRadius: "50%", background: "var(--emerald-100)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2.5">
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="h1">{t("registerUser.youreIn")}</h2>
              <p className="body muted" style={{ maxWidth: 300 }}>
                {t("registerUser.accountReady")}
              </p>
              <Link to="/login" className="btn btn-primary btn-full" style={{ marginTop: 8 }}>
                {t("registerUser.signInNow")}
              </Link>
              <div style={{ marginTop: 4, padding: "10px 14px", borderRadius: 10, background: "var(--amber-50, #fffbeb)", border: "1px solid var(--amber-200, #fde68a)", fontSize: 12.5, color: "var(--amber-800, #92400e)", lineHeight: 1.5, maxWidth: 300, textAlign: "left" }}>
                <strong>{t("registerUser.optional")}</strong> {t("registerUser.optionalVerification")} <strong>{form.email}</strong>.{" "}
                {t("registerUser.confirmAnyTime")}{" "}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "middle" }}>
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {" "}{t("registerUser.verifiedBadge")}
              </div>
            </div>
          ) : (
            <>
              <div className="col" style={{ gap: 8, marginBottom: 32 }}>
                <div className="crumbs">
                  <Link to="/register" style={{ color: "inherit", textDecoration: "none" }}>{t("registerUser.registerBreadcrumb")}</Link>
                  <span className="sep">/</span>
                  {t("registerUser.user")}
                </div>
                <h2 className="h1">{t("registerUser.createYourAccount")}</h2>
                <p className="body muted" style={{ marginTop: 4 }}>
                  {t("registerUser.alreadyHaveOne")}{" "}
                  <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
                    {t("registerUser.signIn")}
                  </Link>
                </p>
              </div>

              <form onSubmit={handleSubmit} className="col" style={{ gap: 20 }}>
                <div className="row" style={{ gap: 12, alignItems: "flex-start" }}>
                  <div className="field grow">
                    <label className="field-label" htmlFor="reg-first">{t("registerUser.firstName")}</label>
                    <div className={`input-wrap${errors.firstName ? " error" : ""}`}>
                      <IconUser />
                      <input id="reg-first" className="input" placeholder="Jane" autoComplete="given-name" value={form.firstName} onChange={set("firstName")} />
                    </div>
                    {errors.firstName && <span className="field-error">{errors.firstName}</span>}
                  </div>
                  <div className="field grow">
                    <label className="field-label" htmlFor="reg-last">{t("registerUser.lastName")}</label>
                    <div className={`input-wrap${errors.lastName ? " error" : ""}`}>
                      <IconUser />
                      <input id="reg-last" className="input" placeholder="Doe" autoComplete="family-name" value={form.lastName} onChange={set("lastName")} />
                    </div>
                    {errors.lastName && <span className="field-error">{errors.lastName}</span>}
                  </div>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reg-email">{t("registerUser.emailAddress")}</label>
                  <div className={`input-wrap${errors.email ? " error" : ""}`}>
                    <IconMail />
                    <input id="reg-email" className="input" type="email" placeholder={t("registerUser.emailPlaceholder")} autoComplete="email" value={form.email} onChange={set("email")} />
                  </div>
                  {errors.email && <span className="field-error">{errors.email}</span>}
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reg-phone">{t("registerUser.phoneNumber")}</label>
                  <div className={`input-wrap${errors.phoneNumber ? " error" : ""}`}>
                    <IconPhone />
                    <input id="reg-phone" className="input" type="tel" placeholder={t("registerUser.phonePlaceholder")} autoComplete="tel" value={form.phoneNumber} onChange={set("phoneNumber")} />
                  </div>
                  {errors.phoneNumber && <span className="field-error">{errors.phoneNumber}</span>}
                  <span className="field-hint">{t("registerUser.phoneHint")}</span>
                </div>

                <div className="field">
                  <label className="field-label" htmlFor="reg-password">{t("registerUser.password")}</label>
                  <PasswordInput id="reg-password" placeholder={t("registerUser.passwordPlaceholder")} autoComplete="new-password" value={form.password} onChange={set("password")} hasError={Boolean(errors.password)} />
                  {form.password && (
                    <div className={`pw-meter s${pwStrength}`}>
                      <span /><span /><span /><span />
                    </div>
                  )}
                  {errors.password && <span className="field-error">{errors.password}</span>}
                  <span className="field-hint">{t("registerUser.passwordHint")}</span>
                </div>

                <div className="field" style={{ marginTop: 4 }}>
                  <label style={{ display: "flex", gap: 10, alignItems: "flex-start", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={agreedToTerms}
                      onChange={(e) => { setAgreedToTerms(e.target.checked); if (e.target.checked) setTermsError(false); }}
                      style={{ marginTop: 2, flexShrink: 0, width: 16, height: 16, cursor: "pointer" }}
                    />
                    <span>
                      {t("registerUser.agreeCheckbox")}{" "}
                      <a href="/terms" target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy-700)", fontWeight: 600 }}>{t("registerUser.terms")}</a>
                      {" "}{t("registerUser.and")}{" "}
                      <a href="/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--navy-700)", fontWeight: 600 }}>{t("registerUser.privacyPolicy")}</a>.
                    </span>
                  </label>
                  {termsError && <span className="field-error" style={{ marginTop: 6 }}>{t("registerUser.termsRequired")}</span>}
                </div>

                <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={!canSubmit || registerMutation.isPending} style={{ marginTop: 4 }}>
                  {registerMutation.isPending ? t("registerUser.creatingAccount") : t("registerUser.createAccount")}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
