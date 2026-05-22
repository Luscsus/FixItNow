export function ActiveJobCard() {
  return (
    <>
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
    </>
  );
}
