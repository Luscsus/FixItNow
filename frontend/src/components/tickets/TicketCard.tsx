import { Link, useNavigate } from "react-router-dom";
import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";

function priorityClass(priority: TicketPriority | null) {
  return priority === "CRITICAL"
    ? "u-critical"
    : priority === "HIGH"
      ? "u-high"
      : priority === "MEDIUM"
        ? "u-medium"
        : "u-low";
}

function priorityBadgeClass(priority: TicketPriority | null) {
  return priority === "CRITICAL"
    ? "urgency urgency-critical"
    : priority === "HIGH"
      ? "urgency urgency-high"
      : priority === "MEDIUM"
        ? "urgency urgency-medium"
        : "urgency urgency-low";
}

function priorityLabel(priority: TicketPriority | null) {
  return priority === "CRITICAL"
    ? "Critical"
    : priority === "HIGH"
      ? "High"
      : priority === "MEDIUM"
        ? "Med"
        : "Low";
}

type StepState = "done" | "current" | "empty";

function statusToSteps(status: TicketStatus): StepState[] {
  switch (status) {
    case "PENDING_APPROVAL":
      return ["current", "empty", "empty", "empty", "empty"];
    case "APPROVED":
      return ["done", "current", "empty", "empty", "empty"];
    case "IN_TRANSIT":
      return ["done", "done", "current", "empty", "empty"];
    case "PENDING_PROVIDER_INVOICE":
      return ["done", "done", "done", "current", "empty"];
    case "PENDING_PAYMENT":
      return ["done", "done", "done", "done", "current"];
    case "COMPLETED":
      return ["done", "done", "done", "done", "done"];
    default:
      return ["empty", "empty", "empty", "empty", "empty"];
  }
}

const PHASE_LABELS = ["Filed", "Approved", "Working", "Invoice", "Done"] as const;

export function TicketCard({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const isTerminal = ticket.status === "DECLINED" || ticket.status === "CANCELLED";
  const steps = statusToSteps(ticket.status);
  const ticketIdStr = `FIX-${String(ticket.id).padStart(4, "0")}`;

  return (
    <div
      className={`ticket ${priorityClass(ticket.priority)}`}
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="ticket-rail" />
      <div className="ticket-body">
        <div className="ticket-row1">
          <span className="ticket-id">{ticketIdStr}</span>
          <span className="ticket-cat">· {ticket.serviceType}</span>
          <span className="grow" />
          <span className={priorityBadgeClass(ticket.priority)}>
            {priorityLabel(ticket.priority)}
          </span>
        </div>

        <h3 className="ticket-title">{ticket.serviceType}</h3>
        {ticket.location ? (
          <div className="muted" style={{ fontSize: 12, marginBottom: 8 }}>{ticket.location}</div>
        ) : null}

        {isTerminal ? (
          <div style={{ margin: "8px 0" }}>
            <span
              className="pill"
              style={{
                background: ticket.status === "DECLINED" ? "var(--red-100, #fee2e2)" : "var(--slate-100)",
                color: ticket.status === "DECLINED" ? "var(--red-700, #b91c1c)" : "var(--slate-500)",
              }}
            >
              <span className="dot" />
              {ticket.status === "DECLINED" ? "Declined" : "Cancelled"}
            </span>
          </div>
        ) : (
          <>
            <div className="mini-rail">
              {steps.map((s, i) => (
                <span key={i} className={s === "done" ? "done" : s === "current" ? "current" : undefined} />
              ))}
            </div>
            <div className="phase-labels">
              {PHASE_LABELS.map((label, i) => {
                const s = steps[i];
                return (
                  <span key={label} className={s === "done" ? "ok" : s === "current" ? "now" : undefined}>
                    {label}
                  </span>
                );
              })}
            </div>
          </>
        )}

        <div className="ticket-prov">
          {ticket.assignedServiceProviderName ? (
            <>
              {ticket.assignedServiceProviderId ? (
                <Link
                  to={`/providers/${ticket.assignedServiceProviderId}`}
                  className="row gap-8"
                  style={{ textDecoration: "none", color: "inherit", alignItems: "center" }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div
                    className="avatar"
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 13,
                      background: "var(--amber-500)",
                      color: "var(--navy-900)",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {ticket.assignedServiceProviderName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="ticket-prov-name">{ticket.assignedServiceProviderName}</div>
                    <div className="ticket-prov-role">Service provider</div>
                  </div>
                </Link>
              ) : (
                <>
                  <div
                    className="avatar"
                    style={{
                      width: 36,
                      height: 36,
                      fontSize: 13,
                      background: "var(--amber-500)",
                      color: "var(--navy-900)",
                      borderRadius: "50%",
                      display: "grid",
                      placeItems: "center",
                      flexShrink: 0,
                    }}
                  >
                    {ticket.assignedServiceProviderName
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </div>
                  <div>
                    <div className="ticket-prov-name">{ticket.assignedServiceProviderName}</div>
                    <div className="ticket-prov-role">Service provider</div>
                  </div>
                </>
              )}
              {ticket.estimatedCost != null ? (
                <>
                  <span className="grow" />
                  <span className="ticket-next">€{ticket.estimatedCost}</span>
                </>
              ) : (
                <span className="grow" />
              )}
            </>
          ) : (
            <>
              <div
                style={{
                  width: 36,
                  height: 36,
                  background: "var(--slate-100)",
                  color: "var(--slate-500)",
                  borderRadius: 18,
                  display: "grid",
                  placeItems: "center",
                  border: "1.5px dashed var(--slate-300)",
                  fontSize: 16,
                  flexShrink: 0,
                }}
              >
                ?
              </div>
              <div>
                <div className="ticket-prov-name muted" style={{ fontWeight: 500 }}>
                  Awaiting provider
                </div>
                <div className="ticket-prov-role">Pending approval</div>
              </div>
              <span className="grow" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
