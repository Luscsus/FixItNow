import { Link } from "react-router-dom";

interface UserHeroProps {
  fullName: string;
  initials: string;
  email: string | undefined;
}

export function UserHero({ fullName, initials, email }: UserHeroProps) {
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
          <div className="acct-avatar">{initials}</div>
          <div>
            <h1>{fullName}</h1>
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
