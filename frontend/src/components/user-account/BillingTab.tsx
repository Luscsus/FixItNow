export function BillingTab() {
  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Payment methods</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>COMING SOON</span>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
          <div
            style={{
              border: "1.5px dashed var(--slate-300)",
              borderRadius: 12,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              gap: 8,
              minHeight: 120,
            }}
          >
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>
              Default card
            </div>
            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>•••• •••• •••• ••••</div>
            <div className="muted" style={{ fontSize: 12 }}>No card on file yet</div>
          </div>
          <div
            style={{
              border: "1px solid var(--border)",
              borderRadius: 12,
              padding: 24,
              display: "flex",
              flexDirection: "column",
              alignItems: "flex-start",
              justifyContent: "center",
              gap: 10,
              minHeight: 120,
              background: "var(--surface-2, #f8fafc)",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>Add a payment method</div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              Save a card to pay providers in one tap after work is approved.
            </div>
            <button className="btn btn-secondary btn-sm" disabled>+ Add card</button>
          </div>
        </div>
      </div>

      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">Billing history</span>
        <span className="rule" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr 100px",
            gap: 12,
            paddingBottom: 12,
            borderBottom: "1px solid var(--border)",
            fontSize: 11,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          <span>Date</span>
          <span>Ticket</span>
          <span>Provider</span>
          <span style={{ textAlign: "right" }}>Amount</span>
        </div>
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate-400)", fontSize: 14 }}>
          No invoices yet — your billing history will show up here.
        </div>
      </div>

      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">Billing address</span>
        <span className="rule" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px" }}>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Name</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Country</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>Street</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
        </div>
      </div>
    </>
  );
}
