import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";
import type { Ticket } from "@/domain/ticket";

function invoiceDate(ticket: Ticket): Date {
  const entry = ticket.statusHistory?.find((h) => h.status === "PENDING_PAYMENT");
  return entry?.changedAt ?? ticket.createdAt;
}

export function BillingTab() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useTicketsQuery();

  const invoices = useMemo(
    () =>
      tickets
        .filter(
          (tk) =>
            tk.estimatedCost != null &&
            (tk.status === "PENDING_PAYMENT" || tk.status === "COMPLETED"),
        )
        .sort((a, b) => invoiceDate(b).getTime() - invoiceDate(a).getTime()),
    [tickets],
  );

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">{t("userAccount.billing_history")}</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>
          {String(invoices.length).padStart(2, "0")} {t("userAccount.billing_invoices")}
        </span>
      </div>

      <div className="card card-pad" style={{ marginBottom: 24 }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "130px 1fr 1fr 100px 90px",
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
          <span style={{ textAlign: "right" }}>{t("userAccount.billing_colStatus")}</span>
        </div>

        {isLoading && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate-400)", fontSize: 14 }}>
            {t("userAccount.billing_loading")}
          </div>
        )}

        {!isLoading && invoices.length === 0 && (
          <div style={{ padding: "40px 0", textAlign: "center", color: "var(--slate-400)", fontSize: 14 }}>
            {t("userAccount.billing_noInvoices")}
          </div>
        )}

        {!isLoading &&
          invoices.map((ticket, i) => {
            const date = invoiceDate(ticket);
            const ticketCode = `FIX-${String(ticket.id).padStart(4, "0")}`;
            const isPaid = ticket.status === "COMPLETED";

            return (
              <div
                key={ticket.id}
                style={{
                  display: "grid",
                  gridTemplateColumns: "130px 1fr 1fr 100px 90px",
                  gap: 12,
                  padding: "12px 0",
                  borderBottom: i < invoices.length - 1 ? "1px solid var(--border)" : "none",
                  alignItems: "center",
                }}
              >
                <span className="mono muted" style={{ fontSize: 12 }}>
                  {date.toLocaleDateString()}
                </span>
                <Link to={`/tickets/${ticket.id}`} style={{ fontWeight: 500, fontSize: 14, color: "var(--navy-700, #142C5E)", textDecoration: "none" }} onMouseEnter={e => (e.currentTarget.style.textDecoration = "underline")} onMouseLeave={e => (e.currentTarget.style.textDecoration = "none")}>{ticketCode}</Link>
                <span className="muted" style={{ fontSize: 13 }}>
                  {ticket.assignedServiceProviderName ?? "—"}
                </span>
                <span
                  style={{
                    textAlign: "right",
                    fontWeight: 600,
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                  }}
                >
                  €{ticket.estimatedCost!.toFixed(2)}
                </span>
                <span style={{ textAlign: "right" }}>
                  <span className={`pill ${isPaid ? "pill-resolved" : "pill-enroute"}`}>
                    <span className="dot" />
                    {isPaid ? t("userAccount.billing_statusPaid") : t("userAccount.billing_statusPending")}
                  </span>
                </span>
              </div>
            );
          })}
      </div>
    </>
  );
}
