import { Link } from "react-router-dom";

interface ProviderHeroProps {
  fullName: string;
  initials: string;
  email: string | undefined;
  online: boolean;
  setOnline: (updater: (v: boolean) => boolean) => void;
}

export function ProviderHero({ fullName, initials, email, online, setOnline }: ProviderHeroProps) {
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
          <div className="pro-avatar">{initials}</div>
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
            <div className="lbl">Earnings · this month</div>
            <div className="val">$6,840<span className="rev-delta">▲ 18%</span></div>
            <div className="hint">vs $5,790 last month · 23 jobs</div>
            <div className="sparkrow">
              {[40, 55, 30, 65, 50, 75, 45, 85, 60, 90, 70, 100].map((h, i) => (
                <span
                  key={i}
                  style={{ height: `${h}%` }}
                  className={h === 100 || h === 90 || h === 85 ? "peak" : h === 30 ? "dim" : undefined}
                />
              ))}
            </div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Rating</div>
            <div className="val">4.9<span className="unit">★</span></div>
            <div className="hint">187 jobs · 142 reviews</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Response time</div>
            <div className="val">11<span className="unit">min</span></div>
            <div className="hint">median · top 8% of trades</div>
          </div>
          <div className="rev-cell">
            <div className="lbl">Completion</div>
            <div className="val">98<span className="unit">%</span></div>
            <div className="hint">same-day finish rate</div>
          </div>
        </div>
      </div>
    </section>
  );
}
