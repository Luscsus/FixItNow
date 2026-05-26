import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import type { Ticket } from "@/domain/ticket";

const PAGE_SIZE = 8;

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const STATUS_LABEL: Record<string, string> = {
  COMPLETED: "Completed",
  CANCELLED: "Cancelled",
  DECLINED:  "Declined",
};

const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: "urgency-critical",
  HIGH: "urgency-high",
  MEDIUM: "urgency-medium",
  LOW: "urgency-low",
};

function fmtDate(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

function CompletedJobRow({ ticket, index }: { ticket: Ticket; index: number }) {
  const navigate = useNavigate();
  const dateLabel = ticket.requestedStartAt
    ? fmtDate(ticket.requestedStartAt)
    : fmtDate(ticket.createdAt);

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
        {STATUS_LABEL[ticket.status] ?? ticket.status}
      </span>
    </div>
  );
}

export function CompletedJobsCard() {
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();
  const [page, setPage] = useState(0);

  const done = tickets.filter(
    (t) => t.status === "COMPLETED" || t.status === "CANCELLED" || t.status === "DECLINED",
  );

  const totalPages = Math.max(1, Math.ceil(done.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages - 1);
  const pageItems = done.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE);

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Past jobs</span>
        <span className="rule" />
        {!isLoading && (
          <span className="mono muted" style={{ fontSize: 11 }}>
            {done.length} {done.length === 1 ? "job" : "jobs"}
          </span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 32, padding: 0 }}>
        {isLoading && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            Loading jobs…
          </div>
        )}
        {!isLoading && done.length === 0 && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            No completed jobs yet.
          </div>
        )}
        {pageItems.map((t, i) => (
          <CompletedJobRow key={t.id} ticket={t} index={i} />
        ))}

        {done.length > PAGE_SIZE && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "12px 20px",
              borderTop: "1px solid var(--border)",
            }}
          >
            <button
              className="btn btn-secondary btn-sm"
              disabled={safePage === 0}
              onClick={() => setPage(safePage - 1)}
            >
              ← Prev
            </button>
            <span className="mono muted" style={{ fontSize: 12 }}>
              Page {safePage + 1} of {totalPages}
            </span>
            <button
              className="btn btn-secondary btn-sm"
              disabled={safePage >= totalPages - 1}
              onClick={() => setPage(safePage + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    </>
  );
}
