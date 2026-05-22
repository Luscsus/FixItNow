const PAST_PAYOUTS = [
  { date: "MAY 09 · FRI", meta: "7 jobs · Chase ····8821", amt: "$1,620" },
  { date: "MAY 02 · FRI", meta: "6 jobs · Chase ····8821", amt: "$1,380" },
  { date: "APR 25 · FRI", meta: "8 jobs · Chase ····8821", amt: "$2,040" },
];

export function PayoutsCard() {
  return (
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
      {PAST_PAYOUTS.map((p) => (
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
  );
}
