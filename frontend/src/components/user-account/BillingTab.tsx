import { useTranslation } from "react-i18next";

export function BillingTab() {
  const { t } = useTranslation();
  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">{t("userAccount.billing_paymentMethods")}</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>{t("userAccount.billing_comingSoon")}</span>
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
              {t("userAccount.billing_defaultCard")}
            </div>
            <div style={{ fontSize: 16, color: "var(--text-muted)" }}>•••• •••• •••• ••••</div>
            <div className="muted" style={{ fontSize: 12 }}>{t("userAccount.billing_noCard")}</div>
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
            <div style={{ fontWeight: 600, fontSize: 14 }}>{t("userAccount.billing_addMethod")}</div>
            <div className="muted" style={{ fontSize: 12, lineHeight: 1.5 }}>
              {t("userAccount.billing_addMethodDesc")}
            </div>
            <button className="btn btn-secondary btn-sm" disabled>{t("userAccount.billing_addCard")}</button>
          </div>
        </div>
      </div>

      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">{t("userAccount.billing_history")}</span>
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
          <span>{t("userAccount.billing_colDate")}</span>
          <span>{t("userAccount.billing_colTicket")}</span>
          <span>{t("userAccount.billing_colProvider")}</span>
          <span style={{ textAlign: "right" }}>{t("userAccount.billing_colAmount")}</span>
        </div>
        <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate-400)", fontSize: 14 }}>
          {t("userAccount.billing_noInvoices")}
        </div>
      </div>

      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">{t("userAccount.billing_address")}</span>
        <span className="rule" />
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px 32px" }}>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("userAccount.billing_name")}</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
          <div>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("userAccount.billing_country")}</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase" }}>{t("userAccount.billing_street")}</div>
            <div className="muted" style={{ fontSize: 15, marginTop: 6 }}>—</div>
          </div>
        </div>
      </div>
    </>
  );
}
