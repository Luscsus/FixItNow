export function ProviderDashboardPage() {
  return (
    <div>
      {/* ── Hero band ── */}
      <section className="dash-hero">
        <div className="dash-hero-grid" />
        <div className="container dash-hero-inner">
          <div className="hero-top">
            <div>
              <span className="eyebrow" style={{ color: "var(--amber-500)" }}>
                Tue · May 13 · 10:48 AM · Good morning, Marcus
              </span>
              <h1 className="dash-hero-headline">
                You've got <b>4 new requests</b><br />
                and one job on the clock.
              </h1>
            </div>

            {/* Online status pod */}
            <div className="status-pod">
              <span className="status-pulse" />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>Online · accepting</div>
                <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 500, marginTop: 2, letterSpacing: "-0.01em" }}>3h 12m today · auto-pause at 4 active</div>
              </div>
              <button
                style={{ width: 44, height: 24, background: "#34D399", borderRadius: 14, position: "relative", border: 0, cursor: "pointer", flexShrink: 0 }}
                aria-label="Go offline"
              >
                <span style={{ position: "absolute", top: 3, left: 23, width: 18, height: 18, borderRadius: 10, background: "#fff", boxShadow: "0 1px 3px rgba(0,0,0,0.2)", display: "block" }} />
              </button>
            </div>
          </div>

          {/* 5-column stats */}
          <div className="hero-stats" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
            <div className="hstat">
              <div className="hstat-label">Jobs today</div>
              <div className="hstat-num">03<span className="delta">↑ +1</span></div>
              <div className="hstat-hint">1 active · 2 scheduled</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">Hours on clock</div>
              <div className="hstat-num">3.2<span className="unit">hr</span></div>
              <div className="hstat-hint">target 8 hr · 40% done</div>
            </div>
            <div className="hstat accent">
              <div className="hstat-label">Earnings · today</div>
              <div className="hstat-num">$485<span className="delta">↑ 22%</span></div>
              <div className="hstat-hint">vs avg Tuesday</div>
            </div>
            <div className="hstat warn">
              <div className="hstat-label">Requests waiting</div>
              <div className="hstat-num">04</div>
              <div className="hstat-hint">1 critical · 4 min decision avg</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">This week</div>
              <div className="hstat-num">$1,840</div>
              <div className="hstat-hint">8 jobs · payout Fri</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container page-area">

        {/* ── Top action row ── */}
        <div className="row" style={{ marginBottom: 24, gap: 12 }}>
          <div className="segment">
            <button aria-pressed={true}>Now</button>
            <button aria-pressed={false}>Today</button>
            <button aria-pressed={false}>This week</button>
            <button aria-pressed={false}>All</button>
          </div>
          <span className="grow" />
          <button className="btn btn-secondary btn-sm">Filters</button>
          <button className="btn btn-secondary btn-sm">Block time</button>
          <a href="#" className="btn btn-secondary btn-sm">My business →</a>
        </div>

        {/* ── Panel 01: Inbound requests ── */}
        <div className="panel-title">
          <span className="num">01</span>
          <span className="label">Inbound requests</span>
          <span className="rule" />
          <span className="mono" style={{ fontSize: 11, color: "var(--amber-700)", background: "var(--amber-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>4 WAITING</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>

          {/* Critical */}
          <div className="req-card u-critical">
            <div className="req-rail" />
            <div className="req-card-inner">
              <div className="req-head">
                <span className="rid">FIX-2423</span>
                <span className="rcat">· Plumbing · Emergency</span>
                <span className="grow" />
                <span className="urgency urgency-critical">Critical</span>
              </div>
              <h3 className="req-title">Burst pipe in utility room — water shut off</h3>
              <div className="req-where">
                <span className="req-pin">📍 Fillmore &amp; Page</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>2.4 mi · 9 min drive</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>Filed 6 min ago</span>
              </div>
              <div className="req-customer">
                <div className="req-cust-av" style={{ background: "oklch(0.6 0.06 220)" }}>TC</div>
                <div>
                  <div className="req-cust-name">Theo &amp; Co. (Restaurant)</div>
                  <div className="req-cust-meta">★ 4.7 · 3 prior jobs · paid on time</div>
                </div>
                <div className="req-money">
                  <span className="big">$400–650</span>
                  <span className="sub">EST. ALL-IN</span>
                </div>
              </div>
              <div className="req-actions">
                <span className="countdown"><span className="ticker" /> Expires in 4:12</span>
                <span className="grow" />
                <button className="btn btn-secondary btn-sm">Decline</button>
                <button className="btn btn-primary btn-sm">Accept &amp; depart →</button>
              </div>
            </div>
          </div>

          {/* High */}
          <div className="req-card u-high">
            <div className="req-rail" />
            <div className="req-card-inner">
              <div className="req-head">
                <span className="rid">FIX-2420</span>
                <span className="rcat">· Plumbing · Water heater</span>
                <span className="grow" />
                <span className="urgency urgency-high">High</span>
              </div>
              <h3 className="req-title">Water heater pilot won't light · 50 gal</h3>
              <div className="req-where">
                <span className="req-pin">📍 Mission · 24th St</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>4.0 mi · 14 min</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>38 min ago</span>
              </div>
              <div className="req-customer">
                <div className="req-cust-av" style={{ background: "oklch(0.55 0.06 200)" }}>ML</div>
                <div>
                  <div className="req-cust-name">Mission Lofts (Building)</div>
                  <div className="req-cust-meta">★ 4.9 · 2 prior jobs</div>
                </div>
                <div className="req-money">
                  <span className="big">$320</span>
                  <span className="sub">QUOTED</span>
                </div>
              </div>
              <div className="req-actions">
                <span className="countdown warm"><span className="ticker" /> Expires in 17:48</span>
                <span className="grow" />
                <button className="btn btn-secondary btn-sm">Decline</button>
                <button className="btn btn-primary btn-sm">Accept →</button>
              </div>
            </div>
          </div>

          {/* Medium */}
          <div className="req-card u-medium">
            <div className="req-rail" />
            <div className="req-card-inner">
              <div className="req-head">
                <span className="rid">FIX-2421</span>
                <span className="rcat">· Plumbing · Drain</span>
                <span className="grow" />
                <span className="urgency urgency-medium">Medium</span>
              </div>
              <h3 className="req-title">Slow drain in 2 bathrooms · likely clog</h3>
              <div className="req-where">
                <span className="req-pin">📍 Hayes Valley · Hayes St</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>3.1 mi · 12 min</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>22 min ago</span>
              </div>
              <div className="req-customer">
                <div className="req-cust-av" style={{ background: "oklch(0.6 0.07 120)" }}>NM</div>
                <div>
                  <div className="req-cust-name">Naomi Mendez</div>
                  <div className="req-cust-meta">New customer · home address</div>
                </div>
                <div className="req-money">
                  <span className="big">$180–240</span>
                  <span className="sub">EST.</span>
                </div>
              </div>
              <div className="req-actions">
                <span className="countdown cool"><span className="ticker" /> Expires in 37 min</span>
                <span className="grow" />
                <button className="btn btn-secondary btn-sm">Decline</button>
                <button className="btn btn-primary btn-sm">Accept →</button>
              </div>
            </div>
          </div>

          {/* Low */}
          <div className="req-card u-low">
            <div className="req-rail" />
            <div className="req-card-inner">
              <div className="req-head">
                <span className="rid">FIX-2417</span>
                <span className="rcat">· Plumbing · Disposal</span>
                <span className="grow" />
                <span className="urgency urgency-low">Low</span>
              </div>
              <h3 className="req-title">Garbage disposal hums, won't spin</h3>
              <div className="req-where">
                <span className="req-pin">📍 Glen Park · Diamond St</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>6.2 mi · 22 min</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>1 hr ago</span>
              </div>
              <div className="req-customer">
                <div className="req-cust-av" style={{ background: "oklch(0.65 0.05 60)" }}>DR</div>
                <div>
                  <div className="req-cust-name">Dani Ruiz</div>
                  <div className="req-cust-meta">New customer · home</div>
                </div>
                <div className="req-money">
                  <span className="big">$140</span>
                  <span className="sub">EST.</span>
                </div>
              </div>
              <div className="req-actions">
                <span className="countdown cool"><span className="ticker" /> Expires in 2:48 hr</span>
                <span className="grow" />
                <button className="btn btn-secondary btn-sm">Decline</button>
                <button className="btn btn-primary btn-sm">Accept →</button>
              </div>
            </div>
          </div>

        </div>

        {/* ── Panel 02: On your plate ── */}
        <div className="panel-title">
          <span className="num">02</span>
          <span className="label">On your plate</span>
          <span className="rule" />
          <span className="mono muted" style={{ fontSize: 11 }}>1 ACTIVE · 2 SCHEDULED TODAY</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>

          {/* Active */}
          <div className="job-card in-progress">
            <div className="job-rail" />
            <div className="job-body">
              <div className="job-head">
                <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em" }}>FIX-2418</span>
                <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>· Plumbing</span>
                <span className="grow" />
                <span className="pill pill-inprogress"><span className="dot" /> On site</span>
              </div>
              <h3 className="req-title">Kitchen sink leak — P-trap swap</h3>
              <div className="job-meta">
                <span>Jordan Reyes · Oakwood Bldg C</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>Started 10:48 · ETA finish 11:35</span>
              </div>
              <div className="mini-rail" style={{ marginTop: 4 }}>
                <span className="done" /><span className="done" /><span className="current" /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="ok">Filed</span>
                <span className="ok">En route</span>
                <span className="now">On site</span>
                <span>Sign-off</span>
                <span>Paid</span>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <button className="btn btn-secondary btn-sm">📷 After-photo</button>
                <button className="btn btn-secondary btn-sm">+ Add time/part</button>
                <span className="grow" />
                <button className="btn btn-ghost btn-sm">Message</button>
                <button className="btn btn-primary btn-sm">Mark done →</button>
              </div>
            </div>
          </div>

          {/* Scheduled */}
          <div className="job-card scheduled">
            <div className="job-rail" />
            <div className="job-body">
              <div className="job-head">
                <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em" }}>FIX-2412</span>
                <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>· Plumbing</span>
                <span className="grow" />
                <span className="pill pill-scheduled"><span className="dot" /> Scheduled</span>
              </div>
              <h3 className="req-title">Re-pipe under sink + faucet swap</h3>
              <div className="job-meta">
                <span>El. Howard · 14th &amp; Howard</span>
                <span>·</span>
                <span className="mono" style={{ fontSize: 12 }}>Today · 2:00–5:00 PM</span>
              </div>
              <div className="mini-rail" style={{ marginTop: 4 }}>
                <span className="done" /><span className="done" /><span className="current" /><span /><span />
              </div>
              <div className="phase-labels">
                <span className="ok">Filed</span>
                <span className="ok">Accepted</span>
                <span className="sch">Scheduled</span>
                <span>On site</span>
                <span>Done</span>
              </div>
              <div className="row" style={{ gap: 8, marginTop: 6 }}>
                <span className="mono muted" style={{ fontSize: 11.5, letterSpacing: "0.04em" }}>$420 · 3 hr</span>
                <span className="grow" />
                <button className="btn btn-secondary btn-sm">Reschedule</button>
                <button className="btn btn-secondary btn-sm">Open ticket →</button>
              </div>
            </div>
          </div>

        </div>

        {/* ── Panel 03 + 04: Route + right rail ── */}
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 24, alignItems: "flex-start" }}>

          {/* Route */}
          <section>
            <div className="panel-title">
              <span className="num">03</span>
              <span className="label">Today's route</span>
              <span className="rule" />
              <span className="mono muted" style={{ fontSize: 11 }}>42 MI · 1h 12m DRIVE</span>
            </div>
            <div className="card card-pad">
              <div className="route">

                <div className="route-stop done">
                  <div className="route-time">8:00 AM<span className="small">finished 9:15</span></div>
                  <div className="route-dot" />
                  <div>
                    <div className="route-title">Water heater install · Mason Lofts</div>
                    <div className="route-customer">FIX-2414 · 50 gal · Tankless swap</div>
                  </div>
                  <div className="route-payout">$1,260</div>
                </div>
                <div className="route-travel">12 min drive · 4.1 mi via Van Ness</div>

                <div className="route-stop now">
                  <div className="route-time">10:48 AM<span className="small">~47 min in</span></div>
                  <div className="route-dot" />
                  <div>
                    <div className="route-title">
                      Kitchen sink leak — P-trap swap{" "}
                      <span className="mono" style={{ color: "var(--amber-700)", fontSize: 11, background: "var(--amber-50)", padding: "2px 6px", borderRadius: 4, marginLeft: 6 }}>ON SITE</span>
                    </div>
                    <div className="route-customer">FIX-2418 · Jordan Reyes · Oakwood C</div>
                  </div>
                  <div className="route-payout">$185</div>
                </div>
                <div className="route-travel">8 min drive · 2.3 mi via Howard</div>

                <div className="route-stop">
                  <div className="route-time">2:00 PM<span className="small">3 hr block</span></div>
                  <div className="route-dot" />
                  <div>
                    <div className="route-title">Re-pipe under sink + faucet swap</div>
                    <div className="route-customer">FIX-2412 · El. Howard · 14th &amp; Howard</div>
                  </div>
                  <div className="route-payout">$420</div>
                </div>
                <div className="route-travel">15 min drive · 5.8 mi via 14th St</div>

                <div className="route-stop">
                  <div className="route-time">5:30 PM<span className="small">est. 45 min</span></div>
                  <div className="route-dot" />
                  <div>
                    <div className="route-title">Quote walk-through · sump pump install</div>
                    <div className="route-customer">FIX-2425 · Bernal Heights · est. only</div>
                  </div>
                  <div className="route-payout">est. $40</div>
                </div>

              </div>

              <div className="divider" style={{ margin: "18px 0" }} />
              <div className="row" style={{ gap: 8 }}>
                <button className="btn btn-secondary btn-sm">Open in Maps</button>
                <button className="btn btn-secondary btn-sm">Reorder</button>
                <span className="grow" />
                <span className="mono muted" style={{ fontSize: 11.5, letterSpacing: "0.04em" }}>PROJECTED · $1,905 today</span>
              </div>
            </div>
          </section>

          {/* Right rail */}
          <aside>

            {/* Performance pulse */}
            <div className="pulse-card">
              <div className="pulse-head">
                <span className="pnum">04</span>
                <span className="plbl">This week</span>
                <span className="ptiny">↑ TOP 8%</span>
              </div>
              <div className="week-bars">
                <span className="bar-done"  style={{ height: "45%" }} />
                <span className="bar-done"  style={{ height: "70%" }} />
                <span className="bar-today" style={{ height: "30%" }} />
                <span style={{ height: "0%" }} />
                <span style={{ height: "0%" }} />
                <span style={{ height: "0%" }} />
                <span style={{ height: "0%" }} />
              </div>
              <div className="week-bars-labels">
                <span>MON</span><span>TUE</span>
                <span style={{ color: "var(--amber-700)", fontWeight: 700 }}>WED</span>
                <span>THU</span><span>FRI</span><span>SAT</span><span>SUN</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <div className="metric-row">
                  <span className="k">Jobs completed</span>
                  <span className="v up">8 <small>↑ from 6</small></span>
                </div>
                <div className="metric-row">
                  <span className="k">Acceptance rate</span>
                  <span className="v">94<small>%</small></span>
                </div>
                <div className="metric-row">
                  <span className="k">Median response</span>
                  <span className="v up">9<small>min</small></span>
                </div>
                <div className="metric-row">
                  <span className="k">On-time arrivals</span>
                  <span className="v">100<small>%</small></span>
                </div>
                <div className="metric-row">
                  <span className="k">Avg rating</span>
                  <span className="v" style={{ color: "var(--amber-700)" }}>4.9<small style={{ color: "var(--amber-500)" }}>★</small></span>
                </div>
              </div>
            </div>

            {/* Next payout */}
            <div className="pulse-card" style={{ background: "var(--navy-900)", color: "#fff", borderColor: "var(--navy-700)", position: "relative", overflow: "hidden", marginTop: 16 }}>
              <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "32px 32px", pointerEvents: "none" }} />
              <div style={{ position: "relative" }}>
                <div className="pulse-head">
                  <span className="pnum" style={{ color: "var(--amber-500)" }}>05</span>
                  <span className="plbl" style={{ color: "#fff" }}>Next payout</span>
                </div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 36, fontWeight: 600, letterSpacing: "-0.04em", color: "var(--amber-500)", lineHeight: 1 }}>
                  $1,840<span style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", marginLeft: 6 }}>.00</span>
                </div>
                <div style={{ fontSize: 12.5, color: "rgba(255,255,255,0.6)", marginTop: 6 }}>Friday May 16 · Chase ····8821 · 7 jobs</div>
                <div style={{ height: 1, background: "rgba(255,255,255,0.12)", margin: "16px 0" }} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <div className="mono" style={{ color: "rgba(255,255,255,0.55)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Pending</div>
                    <div className="mono" style={{ marginTop: 4, letterSpacing: "0.02em", color: "#fff" }}>$485 today</div>
                  </div>
                  <div>
                    <div className="mono" style={{ color: "rgba(255,255,255,0.55)", fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase" }}>Month · MTD</div>
                    <div className="mono" style={{ marginTop: 4, letterSpacing: "0.02em", color: "#fff" }}>$6,840</div>
                  </div>
                </div>
                <a href="#" className="btn btn-accent btn-sm btn-full" style={{ marginTop: 16 }}>See all payouts →</a>
              </div>
            </div>

            {/* Activity feed */}
            <div className="pulse-card" style={{ marginTop: 16 }}>
              <div className="pulse-head">
                <span className="pnum">06</span>
                <span className="plbl">Recent</span>
              </div>
              <div className="activity-row" style={{ gridTemplateColumns: "72px 1fr" }}>
                <span className="activity-time">10:48</span>
                <div>
                  <div className="activity-text">You arrived at <b>FIX-2418</b>.</div>
                  <div className="activity-meta">9 min ahead of ETA</div>
                </div>
              </div>
              <div className="activity-row" style={{ gridTemplateColumns: "72px 1fr" }}>
                <span className="activity-time">10:42</span>
                <div>
                  <div className="activity-text"><b>Jordan</b> opened the side door (code 0488).</div>
                </div>
              </div>
              <div className="activity-row" style={{ gridTemplateColumns: "72px 1fr" }}>
                <span className="activity-time">9:34</span>
                <div>
                  <div className="activity-text">You accepted <b>FIX-2418</b>.</div>
                  <div className="activity-meta">Quoted $185 · ETA 75 min</div>
                </div>
              </div>
              <div className="activity-row" style={{ gridTemplateColumns: "72px 1fr" }}>
                <span className="activity-time">9:15</span>
                <div>
                  <div className="activity-text"><b>Mason Lofts</b> rated FIX-2414 ★★★★★</div>
                  <div className="activity-meta">"Saved us. Will book again."</div>
                </div>
              </div>
              <div className="activity-row" style={{ gridTemplateColumns: "72px 1fr" }}>
                <span className="activity-time">9:12</span>
                <div>
                  <div className="activity-text">Payment <b>$1,260</b> captured for FIX-2414.</div>
                  <div className="activity-meta">Posts to next Friday payout</div>
                </div>
              </div>
            </div>

            {/* Tip card */}
            <div className="pulse-card" style={{ marginTop: 16, background: "var(--amber-50)", borderColor: "var(--amber-100)" }}>
              <span className="eyebrow-plain" style={{ color: "var(--amber-700)" }}>Pro tip · grow your business</span>
              <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0", color: "var(--amber-700)" }}>
                Providers who accept critical jobs within <b>5 minutes</b> see 2.3× more repeat bookings. You're at <b>3:48 median</b> this week — keep it up.
              </p>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
