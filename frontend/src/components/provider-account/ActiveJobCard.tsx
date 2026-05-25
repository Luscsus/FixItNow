import { useNavigate } from "react-router-dom";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import type { Ticket, TicketStatus } from "@/domain/ticket";

const ACTIVE_STATUSES: TicketStatus[] = [
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
];

const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: "urgency-critical",
  HIGH: "urgency-high",
  MEDIUM: "urgency-medium",
  LOW: "urgency-low",
};

const STATUS_CHIP: Record<string, { label: string; color: string; bg: string }> = {
  APPROVED:                 { label: "ACCEPTED",         color: "var(--emerald-700)", bg: "var(--emerald-50)" },
  IN_TRANSIT:               { label: "IN TRANSIT",       color: "var(--amber-700)",   bg: "var(--amber-50)"   },
  PENDING_PROVIDER_INVOICE: { label: "AWAITING INVOICE", color: "var(--slate-600)",   bg: "var(--slate-100)"  },
  PENDING_PAYMENT:          { label: "PENDING PAYMENT",  color: "var(--slate-600)",   bg: "var(--slate-100)"  },
};

const STATUS_PILL: Record<string, string> = {
  APPROVED:                 "Accepted",
  IN_TRANSIT:               "In Transit",
  PENDING_PROVIDER_INVOICE: "Awaiting invoice",
  PENDING_PAYMENT:          "Pending payment",
};

const NEXT_STATUS: Partial<Record<TicketStatus, { status: TicketStatus; label: string }>> = {
  APPROVED:                 { status: "IN_TRANSIT",               label: "Mark as In Transit →"               },
  IN_TRANSIT:               { status: "PENDING_PROVIDER_INVOICE", label: "Mark as Pending Provider Invoice →" },
  PENDING_PROVIDER_INVOICE: { status: "PENDING_PAYMENT",          label: "Mark as Pending Payment →"          },
};

type Step = { label: string; status: TicketStatus };

const STEPS: Step[] = [
  { label: "Pending Approval",         status: "PENDING_APPROVAL"         },
  { label: "Approved",                 status: "APPROVED"                 },
  { label: "In Transit",               status: "IN_TRANSIT"               },
  { label: "Pending Provider Invoice", status: "PENDING_PROVIDER_INVOICE" },
  { label: "Pending Payment",          status: "PENDING_PAYMENT"          },
  { label: "Completed",                status: "COMPLETED"                },
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
  const navigate = useNavigate();
  const updateMut = useUpdateTicketStatusMutation();
  const next = NEXT_STATUS[ticket.status];
  const chip = STATUS_CHIP[ticket.status];

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
              <span>·</span>
              <span className="mono">Scheduled {fmtTime(ticket.requestedStartAt)}</span>
            </>
          )}
          {ticket.estimatedCost != null && (
            <>
              <span>·</span>
              <span className="mono">${ticket.estimatedCost.toFixed(2)} quoted</span>
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
              {updateMut.isPending ? "Updating…" : next.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActiveJobCard() {
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();
  const active = tickets.filter((t) => (ACTIVE_STATUSES as TicketStatus[]).includes(t.status));

  const firstChip = active[0] ? STATUS_CHIP[active[0].status] : null;

  return (
    <>
      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">Active right now</span>
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
          Loading…
        </div>
      )}

      {!isLoading && active.length === 0 && (
        <div className="card" style={{ marginBottom: 32, padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
          No active jobs right now.
        </div>
      )}

      {active.map((ticket) => (
        <ActiveJob key={ticket.id} ticket={ticket} />
      ))}
    </>
  );
}
