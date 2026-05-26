import { Link } from "react-router-dom";

interface UserHeroProps {
  fullName: string;
  initials: string;
  email: string | undefined;
  profilePictureUrl?: string | null;
  emailVerified?: boolean;
}

function VerifiedBadge() {
  return (
    <span
      title="Email verified"
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
      Verified
    </span>
  );
}

function UnverifiedNudge() {
  return (
    <Link
      to="/confirm-email"
      title="Verify your email to get a verified badge"
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
      Verify email
    </Link>
  );
}

export function UserHero({ fullName, initials, email, profilePictureUrl, emailVerified }: UserHeroProps) {
  return (
    <section className="acct-hero">
      <div className="acct-hero-grid" />
      <div className="container">
        <div className="crumbs" style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
          <Link to="/dashboard/user" style={{ color: "rgba(255,255,255,0.55)" }}>Dashboard</Link>
          <span className="sep">/</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>Account</span>
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
              <span className="mono">Customer account</span>
            </div>
          </div>
          <div className="acct-hero-actions">
            <Link to="/profile/edit" className="btn btn-secondary">Edit profile</Link>
            <Link to="/tickets/new" className="btn btn-accent">+ New ticket</Link>
          </div>
        </div>

        <div className="stat-strip">
          <div className="stat-cell">
            <div className="lbl">Tickets filed</div>
            <div className="val">—</div>
            <div className="hint">no data yet</div>
          </div>
          <div className="stat-cell accent">
            <div className="lbl">Spent · YTD</div>
            <div className="val">—</div>
            <div className="hint">no data yet</div>
          </div>
          <div className="stat-cell">
            <div className="lbl">Time to fix</div>
            <div className="val">—</div>
            <div className="hint">median from filed → done</div>
          </div>
          <div className="stat-cell">
            <div className="lbl">Saved providers</div>
            <div className="val">—</div>
            <div className="hint">no data yet</div>
          </div>
        </div>
      </div>
    </section>
  );
}
