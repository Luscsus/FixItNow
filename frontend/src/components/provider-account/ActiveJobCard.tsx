import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import type { Ticket, TicketStatus } from "@/domain/ticket";

const PAGE_SIZE = 4;

const ACTIVE_STATUSES: TicketStatus[] = [
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
];

const STATUS_ORDER: TicketStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
  "COMPLETED",
];

function stepState(stepStatus: TicketStatus, ticketStatus: TicketStatus): "done" | "current" | "pending" {
  const stepIdx   = STATUS_ORDER.indexOf(stepStatus);
  const ticketIdx = STATUS_ORDER.indexOf(ticketStatus);
  if (ticketIdx > stepIdx) return "done";
  if (ticketIdx === stepIdx) return "current";
  return "pending";
}

function fmtTime(d: Date): string {
  const h = d.getHours();
  const m = d.getMinutes();
  const pad = (n: number) => String(n).padStart(2, "0");
  return m === 0 ? `${h}:00` : `${h}:${pad(m)}`;
}

function ActiveJob({ ticket }: { ticket: Ticket }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const updateMut = useUpdateTicketStatusMutation();

  const STATUS_PILL: Record<string, string> = {
    APPROVED:                 t("ticket.pills.accepted"),
    IN_TRANSIT:               t("ticket.status.IN_TRANSIT"),
    PENDING_PROVIDER_INVOICE: t("ticket.pills.pendingInvoice"),
    PENDING_PAYMENT:          t("ticket.pills.pendingPayment"),
  };

  const NEXT_STATUS: Partial<Record<TicketStatus, { status: TicketStatus; label: string }>> = {
    APPROVED:                 { status: "IN_TRANSIT",               label: t("ticket.actions.markInTransit")      },
    IN_TRANSIT:               { status: "PENDING_PROVIDER_INVOICE", label: t("ticket.actions.markWorkComplete")   },
    PENDING_PROVIDER_INVOICE: { status: "PENDING_PAYMENT",          label: t("ticket.actions.markPendingPayment") },
  };

  const STEPS: { label: string; status: TicketStatus }[] = [
    { label: t("ticket.status.PENDING_APPROVAL"),         status: "PENDING_APPROVAL"         },
    { label: t("ticket.status.APPROVED"),                 status: "APPROVED"                 },
    { label: t("ticket.status.IN_TRANSIT"),               status: "IN_TRANSIT"               },
    { label: t("ticket.status.PENDING_PROVIDER_INVOICE"), status: "PENDING_PROVIDER_INVOICE" },
    { label: t("ticket.status.PENDING_PAYMENT"),          status: "PENDING_PAYMENT"          },
    { label: t("ticket.status.COMPLETED"),                status: "COMPLETED"                },
  ];

  const next = NEXT_STATUS[ticket.status];

  return (
    <div
      className="job-card in-progress"
      style={{ marginBottom: 20, cursor: "pointer" }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="job-rail" />
      <div className="job-body">
        <div className="job-head">
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em" }}>
            FIX-{ticket.id}
          </span>
          <span className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", textTransform: "uppercase" }}>
            {ticket.category?.replace(/_/g, " ")}
            {ticket.priority && ` · ${ticket.priority}`}
          </span>
          <span className="grow" />
          <span className="pill pill-inprogress">
            <span className="dot" />
            {STATUS_PILL[ticket.status] ?? ticket.status}
          </span>
        </div>

        <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.25 }}>
          {ticket.serviceType}
        </h3>

        <div className="job-meta">
          {ticket.submittedByName && <span>{ticket.submittedByName}</span>}
          {ticket.submittedByName && ticket.location && <span>·</span>}
          {ticket.location && <span>{ticket.location}</span>}
          {ticket.requestedStartAt && (
            <>
              {(ticket.submittedByName || ticket.location) && <span>·</span>}
              <span>·</span>
              <span className="mono">
                {t("providerAccount.activeJobs_scheduled", { time: fmtTime(ticket.requestedStartAt) })}
              </span>
            </>
          )}
          {ticket.estimatedCost != null && (
            <>
              {(ticket.submittedByName || ticket.location || ticket.requestedStartAt) && <span>·</span>}
              <span>·</span>
              <span className="mono">${ticket.estimatedCost.toFixed(2)} {t("providerAccount.activeJobs_quoted")}</span>
            </>
          )}
        </div>

        {ticket.description && (
          <div style={{ marginTop: 8, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
            {ticket.description}
          </div>
        )}

        <div className="steprail" style={{ marginTop: 18 }}>
          <div className="steprail-bars">
            {STEPS.map((step) => {
              const state = stepState(step.status, ticket.status);
              return (
                <span
                  key={step.status}
                  className={`steprail-bar${state === "done" ? " done" : state === "current" ? " current" : ""}`}
                />
              );
            })}
          </div>
          <div className="steprail-labels">
            {STEPS.map((step) => {
              const state = stepState(step.status, ticket.status);
              const color =
                state === "done"    ? "var(--emerald-700)" :
                state === "current" ? "var(--amber-700)"   :
                "var(--text-muted)";
              return (
                <span key={step.status} style={{ color }}>
                  {step.label}
                </span>
              );
            })}
          </div>
        </div>

        <div className="row" style={{ marginTop: 20, gap: 10 }}>
          <span className="grow" />
          {next && (
            <button
              className="btn btn-primary"
              disabled={updateMut.isPending}
              onClick={(e) => { e.stopPropagation(); updateMut.mutate({ ticketId: ticket.id, status: next.status }); }}
            >
              {updateMut.isPending ? t("providerAccount.activeJobs_updating") : next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActiveJobCard() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();
  const active = tickets.filter((t) => (ACTIVE_STATUSES as TicketStatus[]).includes(t.status));
  const [page, setPage] = useState(1);
  const { pageItems, totalPages, safePage } = usePaginatedItems(active, page, PAGE_SIZE);

  const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
    APPROVED:                 { label: t("ticket.pills.accepted").toUpperCase(),      color: "var(--emerald-700)", bg: "var(--emerald-50)" },
    IN_TRANSIT:               { label: t("ticket.status.IN_TRANSIT").toUpperCase(),   color: "var(--amber-700)",   bg: "var(--amber-50)"   },
    PENDING_PROVIDER_INVOICE: { label: t("ticket.pills.pendingInvoice").toUpperCase(),color: "var(--slate-600)",   bg: "var(--slate-100)"  },
    PENDING_PAYMENT:          { label: t("ticket.pills.pendingPayment").toUpperCase(), color: "var(--slate-600)",   bg: "var(--slate-100)"  },
  };

  const firstChip = active[0] ? STATUS_CHIP[active[0].status] : null;

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">{t("providerAccount.activeJobs_title")}</span>
        <span className="rule" />
        {firstChip && (
          <span
            className="mono"
            style={{
              fontSize: 11,
              color: firstChip.color,
              background: firstChip.bg,
              padding: "3px 8px",
              borderRadius: 4,
              letterSpacing: "0.05em",
            }}
          >
            {firstChip.label}
          </span>
        )}
      </div>

      {isLoading && (
        <div className="card" style={{ marginBottom: 32, padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
          {t("common.loading")}
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <div className="card" style={{ marginBottom: 32, padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
          {t("providerAccount.activeJobs_empty")}
        </div>
      )}

      {pageItems.map((ticket) => (
        <ActiveJob key={ticket.id} ticket={ticket} />
      ))}
      <Pagination page={safePage} total={totalPages} onChange={setPage} />
    </>
  );
}
