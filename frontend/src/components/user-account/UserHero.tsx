import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface UserHeroProps {
  fullName: string;
  initials: string;
  email: string | undefined;
  profilePictureUrl?: string | null;
  emailVerified?: boolean;
}

function VerifiedBadge() {
  const { t } = useTranslation();
  return (
    <span
      title={t("userAccount.hero_emailVerifiedTitle")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 99,
        background: "rgba(22,163,74,0.18)",
        color: "#4ade80",
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        verticalAlign: "middle",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" style={{ flexShrink: 0 }}>
        <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
      {t("userAccount.hero_verified")}
    </span>
  );
}

function UnverifiedNudge() {
  const { t } = useTranslation();
  return (
    <Link
      to="/confirm-email"
      title={t("userAccount.hero_verifyEmailTitle")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        padding: "2px 8px",
        borderRadius: 99,
        background: "rgba(245,158,11,0.18)",
        color: "#fcd34d",
        fontSize: 11.5,
        fontWeight: 600,
        letterSpacing: "0.02em",
        verticalAlign: "middle",
        textDecoration: "none",
      }}
    >
      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
        <circle cx="12" cy="12" r="10" />
        <path d="M12 8v4m0 4h.01" />
      </svg>
      {t("userAccount.hero_verifyEmail")}
    </Link>
  );
}

export function UserHero({ fullName, initials, email, profilePictureUrl, emailVerified }: UserHeroProps) {
  const { t } = useTranslation();
  return (
    <section className="acct-hero">
      <div className="acct-hero-grid" />
      <div className="container">
        <div className="crumbs" style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
          <Link to="/dashboard/user" style={{ color: "rgba(255,255,255,0.55)" }}>{t("userAccount.hero_dashboard")}</Link>
          <span className="sep">/</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{t("userAccount.hero_account")}</span>
        </div>

        <div className="acct-hero-inner">
          <div className="acct-avatar" style={profilePictureUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {profilePictureUrl ? (
              <img
                src={profilePictureUrl}
                alt={fullName}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1 style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              {fullName}
              {emailVerified === true && <VerifiedBadge />}
              {emailVerified === false && <UnverifiedNudge />}
            </h1>
            <div className="sub">
              {email && <span className="mono">{email}</span>}
              {email && <span className="acct-dot-sep" />}
              <span className="mono">{t("userAccount.hero_customerAccount")}</span>
            </div>
          </div>
          <div className="acct-hero-actions">
            <Link to="/profile/edit" className="btn btn-secondary">{t("userAccount.hero_editProfile")}</Link>
            <Link to="/tickets/new" className="btn btn-accent">{t("userAccount.hero_newTicket")}</Link>
          </div>
        </div>

        <div className="stat-strip">
          <div className="stat-cell">
            <div className="lbl">{t("userAccount.hero_ticketsFiled")}</div>
            <div className="val">—</div>
            <div className="hint">{t("userAccount.hero_noData")}</div>
          </div>
          <div className="stat-cell accent">
            <div className="lbl">{t("userAccount.hero_spentYTD")}</div>
            <div className="val">—</div>
            <div className="hint">{t("userAccount.hero_noData")}</div>
          </div>
          <div className="stat-cell">
            <div className="lbl">{t("userAccount.hero_timeToFix")}</div>
            <div className="val">—</div>
            <div className="hint">{t("userAccount.hero_timeToFixHint")}</div>
          </div>
          <div className="stat-cell">
            <div className="lbl">{t("userAccount.hero_savedProviders")}</div>
            <div className="val">—</div>
            <div className="hint">{t("userAccount.hero_noData")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
