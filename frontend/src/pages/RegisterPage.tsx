import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

export function RegisterPage() {
  const { t } = useTranslation();

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-canvas)", display: "flex", flexDirection: "column" }}>
      <header style={{ padding: "24px 40px" }}>
        <Link to="/" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 17, letterSpacing: "-0.02em", textDecoration: "none", color: "inherit" }}>
          <span className="brand-mark" aria-hidden="true" />
          <span>FixIt<span className="brand-now">Now</span></span>
        </Link>
      </header>

      <main style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "40px 24px" }}>
        <div style={{ maxWidth: 640, width: "100%" }}>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <p className="crumbs" style={{ marginBottom: 12 }}>{t("register.createAccount")}</p>
            <h1 className="h1" style={{ fontSize: 36 }}>{t("register.howWillYouUse")}</h1>
            <p className="body muted" style={{ marginTop: 12 }}>{t("register.chooseRole")}</p>
          </div>

          <div className="col" style={{ gap: 16 }}>
            {/* User card */}
            <Link to="/register/user" className="choose-card user-card">
              <span className="recommended-badge">{t("register.recommended")}</span>
              <div className="role-num">01</div>
              <div>
                <div className="role-name">{t("register.iNeedThingsFixed")}</div>
                <div className="role-desc">{t("register.iNeedThingsFixedDesc")}</div>
                <div className="role-tags">
                  <span className="role-tag">{t("register.homeowner")}</span>
                  <span className="role-tag">{t("register.tenant")}</span>
                  <span className="role-tag">{t("register.propertyManager")}</span>
                </div>
              </div>
              <div className="role-cta">
                {t("register.getStarted")}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>

            {/* Provider card */}
            <Link to="/register/provider" className="choose-card">
              <div className="role-num">02</div>
              <div>
                <div className="role-name">{t("register.imAProvider")}</div>
                <div className="role-desc">{t("register.imAProviderDesc")}</div>
                <div className="role-tags">
                  <span className="role-tag">{t("register.plumber")}</span>
                  <span className="role-tag">{t("register.electrician")}</span>
                  <span className="role-tag">{t("register.hvac")}</span>
                  <span className="role-tag">{t("register.plusMore")}</span>
                </div>
              </div>
              <div className="role-cta">
                {t("register.applyNow")}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 8h10M9 4l4 4-4 4" />
                </svg>
              </div>
            </Link>
          </div>

          <p style={{ textAlign: "center", marginTop: 24, fontSize: 14, color: "var(--text-muted)" }}>
            {t("register.alreadyHaveAccount")}{" "}
            <Link to="/login" style={{ color: "var(--navy-700)", fontWeight: 600, textDecoration: "none" }}>
              {t("register.signIn")}
            </Link>
          </p>

          <p style={{ textAlign: "center", marginTop: 16, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.6 }}>
            {t("register.agreeToTerms")}{" "}
            <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>{t("register.termsOfService")}</a>
            {" "}{t("register.and")}{" "}
            <a href="#" style={{ color: "var(--navy-700)", textDecoration: "none" }}>{t("register.privacyPolicy")}</a>.
          </p>
        </div>
      </main>
    </div>
  );
}
