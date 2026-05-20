import { Link } from "react-router-dom";

export function UserDashboardPage() {
  return (
    <div>
      {/* ── Hero band ── */}
      <section className="dash-hero">
        <div className="dash-hero-grid" />
        <div className="container dash-hero-inner">
          <span className="eyebrow" style={{ color: "var(--amber-500)" }}>
            Tue · May 13 · 10:48 AM
          </span>
          <h1 className="dash-hero-headline">
            You've got <span style={{ color: "var(--amber-500)" }}>3 open</span> tickets.<br />
            One needs eyes on it today.
          </h1>
          <div className="hero-stats">
            <div className="hstat">
              <div className="hstat-label">Open</div>
              <div className="hstat-num">04</div>
              <div className="hstat-hint">across 3 buildings</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">In progress</div>
              <div className="hstat-num">02</div>
              <div className="hstat-hint">avg ETA: 1h 12m</div>
            </div>
            <div className="hstat accent">
              <div className="hstat-label">Resolved · 30 days</div>
              <div className="hstat-num">21</div>
              <div className="hstat-hint">↑ 28% vs prior</div>
            </div>
            <div className="hstat danger">
              <div className="hstat-label">High priority</div>
              <div className="hstat-num">01</div>
              <div className="hstat-hint">unassigned · 12 min old</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container page" style={{ paddingTop: 32 }}>

        {/* ── Action row ── */}
        <div className="row" style={{ marginBottom: 24, gap: 12 }}>
          <div className="segment">
            <button aria-pressed={true}>Active</button>
            <button aria-pressed={false}>Scheduled</button>
            <button aria-pressed={false}>Resolved</button>
            <button aria-pressed={false}>All</button>
          </div>
          <span className="grow" />
          <button className="btn btn-secondary btn-sm">Filter</button>
          <select
            className="fselect"
            style={{ width: "auto", padding: "7px 30px 7px 12px", fontSize: 13 }}
            defaultValue="newest"
          >
            <option value="newest">Newest first</option>
            <option value="urgency">By urgency</option>
            <option value="milestone">By next milestone</option>
          </select>
          <Link to="/tickets/new" className="btn btn-primary btn-sm">+ New ticket</Link>
        </div>

        {/* ── Panel 01: Active tickets ── */}
        <div className="panel-title">
          <span className="num">01</span>
          <span className="label">Your active tickets</span>
          <span className="rule" />
          <span className="mono muted" style={{ fontSize: 11.5 }}>04 OPEN</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>

          {/* Critical */}
          <div className="ticket u-critical" style={{ cursor: "pointer" }}>
            <div className="ticket-rail" />
            <div className="ticket-body">
              <div className="ticket-row1">
                <span className="ticket-id">FIX-2418</span>
                <span className="ticket-cat">· Plumbing</span>
                <span className="grow" />
                <span className="urgency urgency-critical">Critical</span>
              </div>
              <h3 className="ticket-title">Kitchen sink leaking under cabinet — water pooling</h3>
              <div className="mini-rail">
                <span className="done" /><span className="done" /><span className="current" /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="ok">Filed</span>
                <span className="ok">Accepted</span>
                <span className="now">On site</span>
                <span>Working</span>
                <span>Done</span>
              </div>
              <div className="ticket-prov">
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: "var(--amber-500)", color: "var(--navy-900)", borderRadius: "50%" }}>MC</div>
                <div>
                  <div className="ticket-prov-name">Marcus Chen</div>
                  <div className="ticket-prov-role">Plumber · Oakwood Pros</div>
                </div>
                <span className="grow" />
                <span className="ticket-next">Next: ETA &lt; 5 min</span>
              </div>
            </div>
          </div>

          {/* High */}
          <div className="ticket u-high" style={{ cursor: "pointer" }}>
            <div className="ticket-rail" />
            <div className="ticket-body">
              <div className="ticket-row1">
                <span className="ticket-id">FIX-2419</span>
                <span className="ticket-cat">· Hardware</span>
                <span className="grow" />
                <span className="urgency urgency-high">High</span>
              </div>
              <h3 className="ticket-title">Front door badge reader unresponsive at main lobby</h3>
              <div className="mini-rail">
                <span className="done" /><span className="current" /><span /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="ok">Filed</span>
                <span className="now">Matching</span>
                <span>Accepted</span>
                <span>Working</span>
                <span>Done</span>
              </div>
              <div className="ticket-prov">
                <div style={{ width: 36, height: 36, background: "var(--slate-100)", color: "var(--slate-500)", borderRadius: 18, display: "grid", placeItems: "center", border: "1.5px dashed var(--slate-300)", fontSize: 16, flexShrink: 0 }}>?</div>
                <div>
                  <div className="ticket-prov-name muted" style={{ fontWeight: 500 }}>Awaiting provider</div>
                  <div className="ticket-prov-role">3 candidates within 4 mi</div>
                </div>
                <span className="grow" />
                <a href="#" className="btn btn-secondary btn-sm">Pick provider</a>
              </div>
            </div>
          </div>

          {/* Medium */}
          <div className="ticket u-medium" style={{ cursor: "pointer" }}>
            <div className="ticket-rail" />
            <div className="ticket-body">
              <div className="ticket-row1">
                <span className="ticket-id">FIX-2417</span>
                <span className="ticket-cat">· HVAC</span>
                <span className="grow" />
                <span className="urgency urgency-medium">Med</span>
              </div>
              <h3 className="ticket-title">Conference room AC blowing warm air — Maple Room</h3>
              <div className="mini-rail">
                <span className="done" /><span className="done" /><span className="current" /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="ok">Filed</span>
                <span className="ok">Accepted</span>
                <span className="sch">Scheduled</span>
                <span>On site</span>
                <span>Done</span>
              </div>
              <div className="ticket-prov">
                <div className="avatar" style={{ width: 36, height: 36, fontSize: 13, background: "oklch(0.65 0.06 60)", borderRadius: "50%" }}>PS</div>
                <div>
                  <div className="ticket-prov-name">Priya Shah</div>
                  <div className="ticket-prov-role">HVAC Tech · ClimaWorks</div>
                </div>
                <span className="grow" />
                <span className="ticket-next" style={{ background: "#DBEAFE", color: "#2563EB" }}>Tomorrow · 8:00 AM</span>
              </div>
            </div>
          </div>

          {/* Low */}
          <div className="ticket u-low" style={{ cursor: "pointer" }}>
            <div className="ticket-rail" />
            <div className="ticket-body">
              <div className="ticket-row1">
                <span className="ticket-id">FIX-2415</span>
                <span className="ticket-cat">· Software</span>
                <span className="grow" />
                <span className="urgency urgency-low">Low</span>
              </div>
              <h3 className="ticket-title">Slack notifications delayed by 5+ minutes</h3>
              <div className="mini-rail">
                <span className="current" /><span /><span /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="now">Filed</span>
                <span>Matching</span>
                <span>Accepted</span>
                <span>Working</span>
                <span>Done</span>
              </div>
              <div className="ticket-prov">
                <div style={{ width: 36, height: 36, background: "var(--slate-100)", color: "var(--slate-500)", borderRadius: 18, display: "grid", placeItems: "center", border: "1.5px dashed var(--slate-300)", fontSize: 16, flexShrink: 0 }}>?</div>
                <div>
                  <div className="ticket-prov-name muted" style={{ fontWeight: 500 }}>Auto-matching…</div>
                  <div className="ticket-prov-role">est. provider in 18 min</div>
                </div>
                <span className="grow" />
                <a href="#" className="btn btn-ghost btn-sm">Browse IT</a>
              </div>
            </div>
          </div>

        </div>

        {/* ── Panel 02 + 03: Activity + Find provider ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "flex-start" }}>

          <section>
            <div className="panel-title">
              <span className="num">02</span>
              <span className="label">Recent activity</span>
              <span className="rule" />
              <a href="#" className="muted mono" style={{ fontSize: 11 }}>SEE ALL →</a>
            </div>
            <div className="card card-pad">
              <div className="activity-row">
                <span className="activity-time">10:48 · TODAY</span>
                <div>
                  <div className="activity-text"><b>Marcus Chen</b> is on site for <b>FIX-2418</b> — confirmed P-trap replacement.</div>
                  <div className="activity-meta">2 photos · ETA ~ 45 min</div>
                </div>
                <span className="pill pill-inprogress"><span className="dot" /> On site</span>
              </div>
              <div className="activity-row">
                <span className="activity-time">10:32</span>
                <div>
                  <div className="activity-text"><b>FIX-2417</b> scheduled for tomorrow 08:00 AM by <b>Priya Shah</b>.</div>
                  <div className="activity-meta">Maple Room · 3rd floor</div>
                </div>
                <span className="pill pill-scheduled"><span className="dot" /> Scheduled</span>
              </div>
              <div className="activity-row">
                <span className="activity-time">09:34</span>
                <div>
                  <div className="activity-text"><b>FIX-2418</b> accepted by <b>Marcus Chen</b>.</div>
                  <div className="activity-meta">Quoted: $185 · ETA 75 min</div>
                </div>
                <span className="pill pill-assigned"><span className="dot" /> Accepted</span>
              </div>
              <div className="activity-row">
                <span className="activity-time">09:12</span>
                <div>
                  <div className="activity-text">You filed <b>FIX-2418</b> — "Kitchen sink leaking under cabinet."</div>
                  <div className="activity-meta">Marked Critical · auto-routed to Plumbing pool</div>
                </div>
                <span className="pill pill-pending"><span className="dot" /> Filed</span>
              </div>
              <div className="activity-row">
                <span className="activity-time">YESTERDAY · 16:02</span>
                <div>
                  <div className="activity-text"><b>Sam Okafor</b> resolved <b>FIX-2411</b> — laptop charging port.</div>
                  <div className="activity-meta">Ready for pickup · loaner returned</div>
                </div>
                <span className="pill pill-resolved"><span className="dot" /> Resolved</span>
              </div>
            </div>
          </section>

          <aside>
            <div className="panel-title">
              <span className="num">03</span>
              <span className="label">Find a provider</span>
              <span className="rule" />
            </div>
            <div className="card card-pad" style={{ padding: 22 }}>
              <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 16px" }}>
                Not sure where to start? Browse vetted providers in your area, or let us auto-match based on category and urgency.
              </p>
              <a href="#" className="btn btn-primary btn-full">Browse providers →</a>
              <div className="divider" style={{ margin: "18px 0" }} />
              <div className="row" style={{ gap: 10 }}>
                <div style={{ fontFamily: "var(--font-mono)", fontWeight: 600, fontSize: 32, color: "var(--navy-700)", letterSpacing: "-0.04em", lineHeight: 1 }}>2,841</div>
                <div>
                  <div style={{ fontSize: 13.5, fontWeight: 600 }}>providers nearby</div>
                  <div className="muted" style={{ fontSize: 12 }}>within 10 mi of Oakwood</div>
                </div>
              </div>
              <div className="divider" style={{ margin: "18px 0" }} />
              <div className="muted" style={{ fontSize: 12.5, lineHeight: 1.6 }}>
                <span className="mono" style={{ color: "var(--text)", letterSpacing: "0.05em" }}>★ 4.8</span>&nbsp; average rating across all categories<br />
                <span className="mono" style={{ color: "var(--text)", letterSpacing: "0.05em" }}>~ 12 min</span>&nbsp; median response time
              </div>
            </div>

            <div className="card card-pad" style={{ marginTop: 16, padding: 22 }}>
              <span className="eyebrow-plain">Pro tip</span>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0", color: "var(--text)" }}>
                For critical issues, add a photo when you file. Providers accept critical tickets <b>3.2× faster</b> when there's visual context.
              </p>
            </div>
          </aside>

        </div>
      </main>
    </div>
  );
}
