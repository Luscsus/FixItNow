export function BuildingsLocationsCard() {
  return (
    <>
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
    </>
  );
}
