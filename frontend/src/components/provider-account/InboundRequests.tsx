const REQUESTS = [
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
];

export function InboundRequests() {
  return (
    <>
      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">Inbound requests</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11 }}>4 waiting</span>
      </div>

      <div className="card" style={{ marginBottom: 32, padding: 0 }}>
        {REQUESTS.map((r) => (
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
            <span
              className="mono"
              style={{
                fontSize: 12.5,
                color: r.estColor,
                background: r.estBg,
                padding: r.estBg !== "transparent" ? "4px 10px" : undefined,
                borderRadius: 6,
              }}
            >
              {r.est}
            </span>
            <div className="ireq-actions">
              <button className="btn btn-secondary btn-sm">Decline</button>
              <button className="btn btn-primary btn-sm">Accept →</button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
