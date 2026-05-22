import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";

const TABS = ["Overview", "Tickets", "Saved providers", "Buildings", "Billing", "Settings"] as const;
type Tab = (typeof TABS)[number];

export function UserAccountPage() {
  const { userInfo, clearSession } = useAuth();
  const { data: profile } = useCurrentUser();
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [notifPrefs, setNotifPrefs] = useState({
    providerReplies: true,
    statusChanges: true,
    quotesEstimates: true,
    weeklyDigest: false,
    marketing: false,
  });

  function toggleNotif(key: keyof typeof notifPrefs) {
    setNotifPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  const firstName = profile?.firstName ?? userInfo.firstName;
  const lastName  = profile?.lastName  ?? userInfo.lastName;
  const email     = profile?.email     ?? userInfo.email;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Account";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";

  return (
    <div>
      {/* ── Hero band ── */}
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
              <button className="btn btn-secondary">Edit profile</button>
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

      {/* ── Body ── */}
      <main className="container acct-body">

        {/* LEFT COLUMN */}
        <div>
          <div className="tabs" role="tablist">
            {TABS.map((tab) => (
              <button
                key={tab}
                role="tab"
                aria-selected={activeTab === tab}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* ── 01 Personal info ── */}
          <div className="panel-title">
            <span className="num">01</span>
            <span className="label">Personal info</span>
            <span className="rule" />
            <a href="#" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em" }}>Edit →</a>
          </div>

          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "28px 32px" }}>
              <div>
                <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>First name</div>
                <div style={{ fontSize: 15, marginTop: 6 }}>{firstName || <span className="muted">—</span>}</div>
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Last name</div>
                <div style={{ fontSize: 15, marginTop: 6 }}>{lastName || <span className="muted">—</span>}</div>
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Email</div>
                <div style={{ fontSize: 15, marginTop: 6, display: "flex", alignItems: "center", gap: 8 }}>
                  {email || <span className="muted">—</span>}
                  {email && (
                    <span className="mono" style={{ fontSize: 10, color: "var(--emerald-700)", background: "var(--emerald-100)", padding: "2px 6px", borderRadius: 4, letterSpacing: "0.06em" }}>VERIFIED</span>
                  )}
                </div>
              </div>
              <div>
                <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Role</div>
                <div style={{ fontSize: 15, marginTop: 6 }}>Customer</div>
              </div>
            </div>
          </div>

          {/* ── 02 Recent tickets ── */}
          <div className="panel-title">
            <span className="num">02</span>
            <span className="label">Recent tickets</span>
            <span className="rule" />
            <Link to="/dashboard/user" className="mono muted" style={{ fontSize: 11, letterSpacing: "0.05em" }}>Go to dashboard →</Link>
          </div>

          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Your ticket history will appear here once you start filing tickets.
            </p>
            <Link to="/dashboard/user" className="btn btn-primary btn-sm" style={{ marginTop: 14, display: "inline-flex" }}>
              Go to dashboard →
            </Link>
          </div>

          {/* ── 03 Buildings & locations ── */}
          <div className="panel-title">
            <span className="num">03</span>
            <span className="label">Buildings &amp; locations</span>
            <span className="rule" />
            <button className="mono" style={{ background: "none", border: 0, color: "var(--accent-deep)", fontSize: 11, letterSpacing: "0.05em", cursor: "pointer" }}>+ Add location</button>
          </div>

          <div className="card card-pad">
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>
              Add your building or service locations to pre-fill them when filing tickets.
            </p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }}>+ Add location</button>
          </div>
        </div>

        {/* RIGHT RAIL */}
        <aside>

          {/* Notifications */}
          <div className="rail-card">
            <div className="rail-head">
              <span className="num">N1</span>
              <span className="label">Notifications</span>
            </div>
            {([
              { key: "providerReplies" as const, title: "Provider replies", sub: "Push + email when assigned" },
              { key: "statusChanges" as const, title: "Status changes", sub: "En route, on site, finished" },
              { key: "quotesEstimates" as const, title: "Quotes & estimates", sub: "Before any work begins" },
              { key: "weeklyDigest" as const, title: "Weekly digest", sub: "Mondays at 8 AM" },
              { key: "marketing" as const, title: "Marketing", sub: "New providers in area" },
            ] as const).map(({ key, title, sub }) => (
              <div className="rail-row" key={key}>
                <div>
                  <div style={{ fontWeight: 500 }}>{title}</div>
                  <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>
                </div>
                <button
                  className="toggle"
                  aria-checked={notifPrefs[key]}
                  onClick={() => toggleNotif(key)}
                >
                  <span className="toggle-track" />
                </button>
              </div>
            ))}
          </div>

          {/* Security */}
          <div className="rail-card">
            <div className="rail-head">
              <span className="num">N2</span>
              <span className="label">Security</span>
            </div>
            <div className="rail-row">
              <span className="k">Email</span>
              <span className="v" style={{ wordBreak: "break-all", textAlign: "right", fontSize: 13 }}>
                {email || "—"}
              </span>
            </div>
            <div className="rail-row">
              <span className="k">Password</span>
              <span className="v mono" style={{ fontSize: 12 }}>••••••••</span>
            </div>
            <div className="rail-row">
              <span className="k">Two-factor</span>
              <span className="v mono" style={{ fontSize: 12, color: "var(--text-muted)" }}>Not set up</span>
            </div>
            <Link to="/profile/security" className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>
              Manage security →
            </Link>
          </div>

          {/* Sign out */}
          <button
            className="btn btn-danger btn-full"
            style={{ marginTop: 20 }}
            onClick={clearSession}
          >
            Sign out
          </button>
        </aside>
      </main>
    </div>
  );
}
