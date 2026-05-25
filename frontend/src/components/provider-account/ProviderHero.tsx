import { Link } from "react-router-dom";

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
}

export function ProviderHero({ fullName, initials, profilePictureUrl, email, online, setOnline, stats }: Readonly<ProviderHeroProps>) {
  return (
    <section className="pro-hero">
      <div className="pro-hero-grid" />
      <div className="container">
        <div className="crumbs" style={{ color: "rgba(255,255,255,0.55)", marginBottom: 18 }}>
          <Link to="/dashboard/provider" style={{ color: "rgba(255,255,255,0.55)" }}>Dashboard</Link>
          <span className="sep">/</span>
          <span style={{ color: "rgba(255,255,255,0.85)" }}>My business</span>
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
              <span className="verified-md">✓ Verified</span>
            </h1>
            <div className="sub">
              {email && <span className="mono">{email}</span>}
              {email && <span className="acct-dot-sep" />}
              <span className="mono">Provider account</span>
            </div>
          </div>

          <div className="availability-pod">
            <div className="avail-row1"><span className="avail-dot" /> Status</div>
            <div className="avail-title">{online ? "Accepting new jobs" : "Offline"}</div>
            <div className="avail-sub">Auto-pause after 4 active tickets</div>
            <div className="avail-switch-row">
              <button
                className="avail-track"
                onClick={() => setOnline((v) => !v)}
                style={{ background: online ? "#34D399" : "var(--slate-500)" }}
                aria-label="Toggle availability"
              />
              <span>{online ? `Online · 3h 12m today` : "Offline"}</span>
            </div>
            <Link to="/profile/edit" className="btn btn-secondary btn-sm" style={{ marginTop: 12, width: "100%", textAlign: "center" }}>
              Edit profile
            </Link>
          </div>
        </div>

        <div className="rev-strip">
          <div className="rev-cell amber">
            <div className="lbl">Total earned</div>
            <div className="val">
              {stats?.totalEarned != null
                ? `$${stats.totalEarned.toFixed(2)}`
                : "—"}
            <div className="lbl">Earnings · this month</div>
            <div className="val">$6,840<span className="rev-delta">▲ 18%</span></div>
            <div className="hint">vs $5,790 last month · 23 jobs</div>
            <div className="sparkrow">
              {[40, 55, 30, 65, 50, 75, 45, 85, 60, 90, 70, 100].map((h) => {
                let cls: string | undefined;
                if (h >= 85) cls = "peak";
                else if (h === 30) cls = "dim";
                return <span key={h} style={{ height: `${h}%` }} className={cls} />;
              })}
            </div>
            <div className="hint">{stats?.completedJobs ?? 0} completed job{stats?.completedJobs !== 1 ? "s" : ""}</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Completed jobs</div>
            <div className="val">{stats?.completedJobs ?? "—"}</div>
            <div className="hint">all time</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Active jobs</div>
            <div className="val">{stats?.activeJobs ?? "—"}</div>
            <div className="hint">currently in progress</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Inbound requests</div>
            <div className="val">{stats?.inboundRequests ?? "—"}</div>
            <div className="hint">awaiting your response</div>
          </div>
        </div>
      </div>
    </section>
  );
}
