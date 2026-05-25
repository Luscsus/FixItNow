export function SupportCard() {
  return (
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
  );
}
