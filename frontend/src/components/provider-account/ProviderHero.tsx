import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface ProviderStats {
  completedJobs: number;
  activeJobs: number;
  inboundRequests: number;
  totalEarned: number | null;
}

interface ProviderHeroProps {
  fullName: string;
  initials: string;
  profilePictureUrl?: string | null;
  email: string | undefined;
  online: boolean;
  setOnline: (updater: (v: boolean) => boolean) => void;
  stats?: ProviderStats;
  emailVerified?: boolean;
}

export function ProviderHero({ fullName, initials, profilePictureUrl, email, online, setOnline, stats, emailVerified }: Readonly<ProviderHeroProps>) {
  const { t } = useTranslation();
  const completedCount = stats?.completedJobs ?? 0;
  const completedHint = t("providerAccount.hero_completedJobsHint", { count: completedCount });

  return (
    <section className="pro-hero">
      <div className="pro-hero-grid" />
      <div className="container">
        <div className="crumbs" style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
          <Link to="/dashboard/provider" style={{ color: "rgba(255,255,255,0.55)" }}>{t("providerAccount.hero_dashboard")}</Link>
          <span className="sep">/</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>{t("providerAccount.hero_myBusiness")}</span>
        </div>

        <div className="pro-hero-inner">
          <div className="pro-avatar" style={profilePictureUrl ? { padding: 0, overflow: "hidden" } : undefined}>
            {profilePictureUrl ? (
              <img src={profilePictureUrl} alt={fullName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              initials
            )}
          </div>
          <div>
            <h1>
              {fullName}
              {emailVerified === true ? (
                <span className="verified-md">{t("providerAccount.hero_verified")}</span>
              ) : emailVerified === false ? (
                <Link
                  to="/confirm-email"
                  className="verified-md"
                  style={{
                    background: "rgba(245,158,11,0.18)",
                    color: "#fcd34d",
                    textDecoration: "none",
                  }}
                  title={t("providerAccount.hero_verifyEmailTitle")}
                >
                  {t("providerAccount.hero_verifyEmail")}
                </Link>
              ) : null}
            </h1>
            <div className="sub">
              {email && <span className="mono">{email}</span>}
              {email && <span className="acct-dot-sep" />}
              <span className="mono">{t("providerAccount.hero_providerAccount")}</span>
            </div>
          </div>

          <div className="availability-pod">
            <div className="avail-row1"><span className="avail-dot" /> {t("providerAccount.hero_status")}</div>
            <div className="avail-title">{online ? t("providerAccount.hero_accepting") : t("providerAccount.hero_offline")}</div>
            <div className="avail-sub">{t("providerAccount.hero_autoPause")}</div>
            <div className="avail-switch-row">
              <button
                className="avail-track"
                onClick={() => setOnline((v) => !v)}
                style={{ background: online ? "#34D399" : "var(--slate-500)" }}
                aria-label={t("providerAccount.hero_status")}
              />
              <span>{online ? t("providerAccount.hero_online", { time: "3h 12m" }) : t("providerAccount.hero_offline")}</span>
            </div>
            <Link to="/profile/edit" className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: "100%", textAlign: "center" }}>
              {t("providerAccount.hero_editProfile")}
            </Link>
          </div>
        </div>

        <div className="rev-strip">
          <div className="rev-cell amber">
            <div className="lbl">{t("providerAccount.hero_totalEarned")}</div>
            <div className="val">
              {stats?.totalEarned != null
                ? `$${stats.totalEarned.toFixed(2)}`
                : "—"}
            </div>
            <div className="hint">{completedHint}</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">{t("providerAccount.hero_completedJobs")}</div>
            <div className="val">{stats?.completedJobs ?? "—"}</div>
            <div className="hint">{t("providerAccount.hero_allTime")}</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">{t("providerAccount.hero_activeJobs")}</div>
            <div className="val">{stats?.activeJobs ?? "—"}</div>
            <div className="hint">{t("providerAccount.hero_activeJobsHint")}</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">{t("providerAccount.hero_inboundRequests")}</div>
            <div className="val">{stats?.inboundRequests ?? "—"}</div>
            <div className="hint">{t("providerAccount.hero_inboundHint")}</div>
          </div>
        </div>
      </div>
    </section>
  );
}
