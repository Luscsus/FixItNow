import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";

const TABS = ["Today", "Schedule", "Jobs", "Reviews", "Earnings", "Documents", "Profile"] as const;
type Tab = (typeof TABS)[number];

export function ProviderAccountPage() {
  const { userInfo, clearSession } = useAuth();
  const { data: profile } = useCurrentProvider();
  const [activeTab, setActiveTab] = useState<Tab>("Today");
  const [online, setOnline] = useState(true);

  const firstName = profile?.firstName ?? userInfo.firstName;
  const lastName  = profile?.lastName  ?? userInfo.lastName;
  const email     = profile?.email     ?? userInfo.email;
  const fullName  = [firstName, lastName].filter(Boolean).join(" ") || "Provider";
  const initials  = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || userInfo.initials || "?";

  return (
    <div>
      {/* ── Hero band ── */}
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
            </div>
          </div>

          {/* Revenue strip */}
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

      {/* ── Body ── */}
      <main className="container pro-body">

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
                {tab === "Jobs" && <span className="count">187</span>}
                {tab === "Reviews" && <span className="count">142</span>}
              </button>
            ))}
          </div>

          {/* ── 01 Active right now ── */}
          <div className="panel-title">
            <span className="num">01</span>
            <span className="label">Active right now</span>
            <span className="rule" />
            <span className="mono" style={{ fontSize: 11, color: "var(--amber-700)", background: "var(--amber-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>ON SITE</span>
          </div>

          <div className="job-card in-progress" style={{ marginBottom: 32 }}>
            <div className="job-rail" />
            <div className="job-body">
              <div className="job-head">
                <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em" }}>FIX-2418</span>
                <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>PLUMBING · CRITICAL</span>
                <span className="grow" />
                <span className="pill pill-inprogress"><span className="dot" /> Working</span>
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>Kitchen sink leak — P-trap swap</h3>
              <div className="job-meta">
                <span>Jordan Reyes · Oakwood Bldg C</span>
                <span>•</span>
                <span className="mono">Started 10:48 · ETA 11:35</span>
                <span>•</span>
                <span className="mono">$185 quoted</span>
              </div>

              <div className="steprail" style={{ marginTop: 18 }}>
                <div className="steprail-bars">
                  <span className="steprail-bar done" />
                  <span className="steprail-bar done" />
                  <span className="steprail-bar current" />
                  <span className="steprail-bar" />
                  <span className="steprail-bar" />
                </div>
                <div className="steprail-labels">
                  <span>Accepted<b style={{ color: "var(--emerald-700)" }}>9:34 AM</b></span>
                  <span>En route<b style={{ color: "var(--emerald-700)" }}>10:34</b></span>
                  <span style={{ color: "var(--amber-700)" }}>On site<b style={{ color: "var(--amber-700)" }}>10:48</b></span>
                  <span>Sign-off<b style={{ color: "var(--text-muted)", fontWeight: 500 }}>~ 11:35</b></span>
                  <span>Paid<b style={{ color: "var(--text-muted)", fontWeight: 500 }}>today</b></span>
                </div>
              </div>

              <div className="row" style={{ marginTop: 20, gap: 10 }}>
                <button className="btn btn-secondary">Upload after-photo</button>
                <button className="btn btn-secondary">Add part / time</button>
                <span className="grow" />
                <a href="#" className="btn btn-ghost">Message Jordan</a>
                <button className="btn btn-primary">Mark done →</button>
              </div>
            </div>
          </div>

          {/* ── 02 Inbound requests ── */}
          <div className="panel-title">
            <span className="num">02</span>
            <span className="label">Inbound requests</span>
            <span className="rule" />
            <span className="mono muted" style={{ fontSize: 11 }}>4 waiting</span>
          </div>

          <div className="card" style={{ marginBottom: 32, padding: 0 }}>
            {[
              {
                id: "FIX-2423",
                title: "Burst pipe in utility room — water shut off",
                urgency: "urgency-critical" as const,
                urgencyLabel: "Critical",
                location: "Fillmore & Page · 2.4 mi",
                age: "6 min ago",
                customer: "Theo & Co · ★ 4.7 · 3 prior jobs",
                est: "~ $400-650",
                estColor: "var(--amber-700)",
                estBg: "var(--amber-50)",
              },
              {
                id: "FIX-2421",
                title: "Slow drain · 2 bathrooms",
                urgency: "urgency-medium" as const,
                urgencyLabel: "Medium",
                location: "Hayes Valley · 3.1 mi",
                age: "22 min ago",
                customer: "New customer",
                est: "~ $180-240",
                estColor: "var(--text-muted)",
                estBg: "transparent",
              },
              {
                id: "FIX-2420",
                title: "Water heater pilot won't light · 50 gal",
                urgency: "urgency-high" as const,
                urgencyLabel: "High",
                location: "Mission · 4.0 mi",
                age: "38 min ago",
                customer: "Mission Lofts · ★ 4.9 · 2 prior jobs",
                est: "~ $320",
                estColor: "var(--text-muted)",
                estBg: "transparent",
              },
              {
                id: "FIX-2417",
                title: "Garbage disposal humming, won't spin",
                urgency: "urgency-low" as const,
                urgencyLabel: "Low",
                location: "Glen Park · 6.2 mi",
                age: "1 hr ago",
                customer: "New customer",
                est: "~ $140",
                estColor: "var(--text-muted)",
                estBg: "transparent",
              },
            ].map((r) => (
              <div className="inbound-req" key={r.id}>
                <span className="ireq-id">{r.id}</span>
                <div>
                  <div className="ireq-title">{r.title}</div>
                  <div className="ireq-meta">
                    <span className={`urgency ${r.urgency}`}>{r.urgencyLabel}</span>
                    <span>•</span>
                    <span>{r.location}</span>
                    <span>•</span>
                    <span className="mono">{r.age}</span>
                    <span>•</span>
                    <span>{r.customer}</span>
                  </div>
                </div>
                <span className="mono" style={{ fontSize: 12.5, color: r.estColor, background: r.estBg, padding: r.estBg !== "transparent" ? "4px 10px" : undefined, borderRadius: 6 }}>{r.est}</span>
                <div className="ireq-actions">
                  <button className="btn btn-secondary btn-sm">Decline</button>
                  <button className="btn btn-primary btn-sm">Accept →</button>
                </div>
              </div>
            ))}
          </div>

          {/* ── 03 This week's schedule ── */}
          <div className="panel-title">
            <span className="num">03</span>
            <span className="label">This week · May 12–18</span>
            <span className="rule" />
            <button className="btn btn-secondary btn-sm">+ Block time</button>
          </div>

          <div className="week-grid" style={{ marginBottom: 32 }}>
            {/* Header row */}
            <div className="wg-head" style={{ background: "var(--slate-50)", borderRight: "1px solid var(--border)" }} />
            <div className="wg-head">MON<b>12</b></div>
            <div className="wg-head today">TUE<b>13</b></div>
            <div className="wg-head">WED<b>14</b></div>
            <div className="wg-head">THU<b>15</b></div>
            <div className="wg-head">FRI<b>16</b></div>
            <div className="wg-head">SAT<b>17</b></div>
            <div className="wg-head">SUN<b>18</b></div>

            {/* 8AM row */}
            <div className="wg-time">8AM</div>
            <div className="wg-slot"><div className="wg-event book"><b>8:00</b>Water heater · Mason</div></div>
            <div className="wg-slot"><div className="wg-event book"><b>7:00–11</b>HVAC inspect</div></div>
            <div className="wg-slot"><div className="wg-event">Repipe est.</div></div>
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event book"><b>8:30</b>Drain clean · Lin</div></div>
            <div className="wg-slot off"><div className="wg-event off">OFF</div></div>
            <div className="wg-slot off"><div className="wg-event off">OFF</div></div>

            {/* 10AM row */}
            <div className="wg-time">10</div>
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event warn"><b>10:48</b>FIX-2418 · ON SITE</div></div>
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event book"><b>10:00</b>Faucet · Howard St</div></div>
            <div className="wg-slot" />
            <div className="wg-slot off" />
            <div className="wg-slot off" />

            {/* 12PM row */}
            <div className="wg-time">12PM</div>
            <div className="wg-slot"><div className="wg-event">Lunch buffer</div></div>
            <div className="wg-slot"><div className="wg-event">Lunch</div></div>
            <div className="wg-slot"><div className="wg-event">Lunch</div></div>
            <div className="wg-slot"><div className="wg-event">Lunch</div></div>
            <div className="wg-slot"><div className="wg-event">Lunch</div></div>
            <div className="wg-slot off" />
            <div className="wg-slot off" />

            {/* 2PM row */}
            <div className="wg-time">2</div>
            <div className="wg-slot"><div className="wg-event book"><b>2:00–5</b>Re-pipe · 14th &amp; Howard</div></div>
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event book"><b>2:00</b>Disposal swap</div></div>
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event book"><b>2:30</b>Sump install</div></div>
            <div className="wg-slot off" />
            <div className="wg-slot off" />

            {/* 4PM row */}
            <div className="wg-time">4</div>
            <div className="wg-slot" />
            <div className="wg-slot" />
            <div className="wg-slot" />
            <div className="wg-slot"><div className="wg-event book"><b>4:00</b>Inspection · Bldg A</div></div>
            <div className="wg-slot" />
            <div className="wg-slot off" />
            <div className="wg-slot off" />
          </div>

          {/* ── 04 Credentials & documents ── */}
          <div className="panel-title">
            <span className="num">04</span>
            <span className="label">Credentials &amp; documents</span>
            <span className="rule" />
            <button className="btn btn-secondary btn-sm">+ Upload</button>
          </div>

          <div className="card card-pad">
            {[
              {
                icon: "LIC", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
                name: "Plumbing license · CA-0488221",
                meta: "CSLB · class C-36 · expires 12/27",
                status: "ds-ok", statusLabel: "✓ Verified",
              },
              {
                icon: "INS", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
                name: "General liability · $2M coverage",
                meta: "Hartford · policy GL-948822 · expires 09/26",
                status: "ds-ok", statusLabel: "✓ On file",
              },
              {
                icon: "W-9", iconBg: "var(--emerald-100)", iconColor: "var(--emerald-700)",
                name: "W-9 tax form",
                meta: "Submitted Feb 2024 · EIN ··· 8821",
                status: "ds-ok", statusLabel: "✓ Filed",
              },
              {
                icon: "WC", iconBg: "var(--amber-100)", iconColor: "var(--amber-700)",
                name: "Workers' comp",
                meta: "State Fund · expires in 22 days · 06/05/26",
                status: "ds-warn", statusLabel: "⚠ Renew",
              },
              {
                icon: "BG", iconBg: "var(--slate-100)", iconColor: "var(--slate-600)",
                name: "Background check",
                meta: "Checkr · cleared 02/14/24 · 2yr re-check on file",
                status: "ds-ok", statusLabel: "✓ Cleared",
              },
            ].map((d) => (
              <div className="doc-row" key={d.icon}>
                <div className="doc-icon" style={{ background: d.iconBg, color: d.iconColor }}>{d.icon}</div>
                <div>
                  <div className="doc-name">{d.name}</div>
                  <div className="doc-meta">{d.meta}</div>
                </div>
                <span className={`doc-status ${d.status}`}>{d.statusLabel}</span>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT RAIL */}
        <aside>

          {/* Specialties & rates */}
          <div className="rail-card">
            <div className="rail-head">
              <span className="num">P1</span>
              <span className="label">Specialties &amp; rates</span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {["Emergency calls", "Commercial", "P-trap & fixtures", "Water heaters", "Drain & sewer", "Re-pipe"].map((s) => (
                <span className="specchip" key={s}>{s}</span>
              ))}
            </div>
            <div className="rail-row">
              <span className="k">Hourly</span>
              <span className="v mono" style={{ fontSize: 14 }}>$95 <span className="muted">/ hr</span></span>
            </div>
            <div className="rail-row">
              <span className="k">Minimum</span>
              <span className="v mono" style={{ fontSize: 14 }}>1 hr</span>
            </div>
            <div className="rail-row">
              <span className="k">After hours</span>
              <span className="v mono" style={{ fontSize: 14 }}>+ $50</span>
            </div>
            <div className="rail-row">
              <span className="k">Service area</span>
              <span className="v mono" style={{ fontSize: 14 }}>8 mi radius</span>
            </div>
            <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>Edit pricing →</button>
          </div>

          {/* Payouts */}
          <div className="rail-card">
            <div className="rail-head">
              <span className="num">P2</span>
              <span className="label">Payouts</span>
            </div>
            <div style={{ background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
              <div className="mono" style={{ fontSize: 10.5, color: "var(--navy-700)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>Next deposit</div>
              <div className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6, color: "var(--navy-900)" }}>$1,840.00</div>
              <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>Friday May 16 · Chase ····8821</div>
            </div>
            {[
              { date: "MAY 09 · FRI", meta: "7 jobs · Chase ····8821", amt: "$1,620" },
              { date: "MAY 02 · FRI", meta: "6 jobs · Chase ····8821", amt: "$1,380" },
              { date: "APR 25 · FRI", meta: "8 jobs · Chase ····8821", amt: "$2,040" },
            ].map((p) => (
              <div className="payout-row" key={p.date}>
                <div>
                  <div className="payout-date">{p.date}</div>
                  <div className="payout-meta">{p.meta}</div>
                </div>
                <span className="payout-amt">{p.amt}</span>
              </div>
            ))}
            <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>View all payouts →</button>
          </div>

          {/* Profile completeness */}
          <div className="rail-card" style={{ background: "var(--amber-50)", borderColor: "var(--amber-100)" }}>
            <div className="rail-head">
              <span className="num" style={{ color: "var(--amber-700)" }}>P3</span>
              <span className="label" style={{ color: "var(--amber-700)" }}>Profile · 84%</span>
            </div>
            <div style={{ height: 6, background: "rgba(180,83,9,0.15)", borderRadius: 3, overflow: "hidden" }}>
              <div style={{ width: "84%", height: "100%", background: "var(--amber-500)" }} />
            </div>
            <div style={{ marginTop: 14, fontSize: 13, lineHeight: 1.55, color: "var(--amber-700)" }}>
              Add <b>2 more photos</b> of past work and <b>a short bio</b> to reach 100%. Top-completed profiles get 3× more requests.
            </div>
            <button className="btn btn-accent btn-sm btn-full" style={{ marginTop: 14 }}>Finish profile →</button>
          </div>

          {/* Support */}
          <div className="rail-card">
            <div className="rail-head">
              <span className="num">P4</span>
              <span className="label">Support</span>
            </div>
            <div className="rail-row">
              <span className="k">Provider line</span>
              <span className="v mono" style={{ fontSize: 12.5 }}>1-800-FIX-OPS</span>
            </div>
            <div className="rail-row">
              <span className="k">Account manager</span>
              <span className="v">Reese O.</span>
            </div>
            <div className="rail-row">
              <span className="k">Avg reply</span>
              <span className="v mono" style={{ fontSize: 12.5 }}>&lt; 12 min</span>
            </div>
            <button className="btn btn-secondary btn-sm btn-full" style={{ marginTop: 14 }}>Open a ticket →</button>
          </div>

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
