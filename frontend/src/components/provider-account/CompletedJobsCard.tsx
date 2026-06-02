import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import type { Ticket } from "@/domain/ticket";

const PAGE_SIZE = 8;

const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: "urgency-critical",
  HIGH: "urgency-high",
  MEDIUM: "urgency-medium",
  LOW: "urgency-low",
};

function fmtDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}

function CompletedJobRow({ ticket }: { readonly ticket: Ticket }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const dateLabel = ticket.requestedStartAt
    ? fmtDate(ticket.requestedStartAt, i18n.language)
    : fmtDate(ticket.createdAt, i18n.language);

  const statusLabel: Record<string, string> = {
    COMPLETED: t("providerAccount.completedJobs_completed"),
    CANCELLED: t("providerAccount.completedJobs_cancelled"),
    DECLINED: t("providerAccount.completedJobs_declined"),
  };

  return (
    <div
      className="inbound-req"
      style={{ alignItems: "flex-start", cursor: "pointer" }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <span className="ireq-id">FIX-{ticket.id}</span>
      <div style={{ flex: 1 }}>
        <div className="ireq-title">{ticket.serviceType}</div>
        <div className="ireq-meta">
          {ticket.priority && (
            <>
              <span className={`urgency ${PRIORITY_CLASS[ticket.priority] ?? "urgency-medium"}`}>
                {ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase()}
              </span>
              <span>•</span>
            </>
          )}
          <span>{ticket.location}</span>
          {ticket.submittedByName && (
            <>
              <span>•</span>
              <span>{ticket.submittedByName}</span>
            </>
          )}
          <span>•</span>
          <span className="mono">{dateLabel}</span>
          {ticket.estimatedCost != null && (
            <>
              <span>•</span>
              <span className="mono" style={{ color: "var(--emerald-700)", fontWeight: 600 }}>
                ${ticket.estimatedCost.toFixed(2)}
              </span>
            </>
          )}
        </div>
        {ticket.description && (
          <div style={{ marginTop: 4, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.4 }}>
            {ticket.description.length > 120
              ? ticket.description.slice(0, 120) + "…"
              : ticket.description}
          </div>
        )}
      </div>
      <span
        style={{
          fontSize: 11,
          fontFamily: "var(--font-mono)",
          background: ticket.status === "COMPLETED" ? "var(--emerald-50)" : "var(--slate-100)",
          color: ticket.status === "COMPLETED" ? "var(--emerald-700)" : "var(--text-muted)",
          border: `1px solid ${ticket.status === "COMPLETED" ? "var(--emerald-100)" : "var(--slate-200)"}`,
          borderRadius: 4,
          padding: "2px 8px",
          whiteSpace: "nowrap",
          alignSelf: "flex-start",
        }}
      >
        {statusLabel[ticket.status] ?? ticket.status}
      </span>
    </div>
  );
}

export function CompletedJobsCard() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();
  const [page, setPage] = useState(1);

  const done = tickets.filter(
    (tk) => tk.status === "COMPLETED" || tk.status === "CANCELLED" || tk.status === "DECLINED",
  );

  const { pageItems, totalPages, safePage } = usePaginatedItems(done, page, PAGE_SIZE);

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">{t("providerAccount.completedJobs_title")}</span>
        <span className="rule" />
        {!isLoading && (
          <span className="mono muted" style={{ fontSize: 11 }}>
            {t("providerAccount.completedJobs_job", { count: done.length })}
          </span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 32, padding: 0 }}>
        {isLoading && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            {t("providerAccount.completedJobs_loading")}
          </div>
        )}
        {!isLoading && done.length === 0 && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            {t("providerAccount.completedJobs_empty")}
          </div>
        )}
        {pageItems.map((tk) => (
          <CompletedJobRow key={tk.id} ticket={tk} />
        ))}
      </div>
      <Pagination page={safePage} total={totalPages} onChange={setPage} />
    </>
  );
}
