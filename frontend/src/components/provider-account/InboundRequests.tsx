import { useNavigate } from "react-router-dom";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useConfirmTicketMutation, useDeclineTicketMutation } from "@/hooks/useConfirmTicketMutation";
import type { Ticket } from "@/domain/ticket";

const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: "urgency-critical",
  HIGH: "urgency-high",
  MEDIUM: "urgency-medium",
  LOW: "urgency-low",
};

const PRIORITY_LABEL: Record<string, string> = {
  CRITICAL: "Critical",
  HIGH: "High",
  MEDIUM: "Medium",
  LOW: "Low",
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(d: Date) {
  return d.getMinutes() === 0 ? `${d.getHours()}:00` : `${d.getHours()}:${pad(d.getMinutes())}`;
}

function fmtAge(d: Date): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hr ago`;
  return `${Math.floor(hrs / 24)} d ago`;
}

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function RequestedTimeChip({ startAt, endAt }: { startAt: Date; endAt: Date | null | undefined }) {
  const s = startAt;
  const timeRange = endAt
    ? `${fmtTime(s)}–${fmtTime(endAt)}`
    : fmtTime(s);
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        fontFamily: "var(--font-mono)",
        background: "var(--amber-50)",
        color: "var(--amber-700)",
        border: "1px solid var(--amber-100)",
        borderRadius: 5,
        padding: "2px 8px",
      }}
    >
      🕐 {DAYS[s.getDay()]} {MONTHS[s.getMonth()]} {s.getDate()} · {timeRange}
    </span>
  );
}

function InboundRow({ ticket }: { ticket: Ticket }) {
  const navigate = useNavigate();
  const confirmMut = useConfirmTicketMutation();
  const declineMut = useDeclineTicketMutation();
  const busy = confirmMut.isPending || declineMut.isPending;

  return (
    <div
      className="inbound-req"
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <span className="ireq-id">FIX-{ticket.id}</span>
      <div>
        <div className="ireq-title">{ticket.serviceType}</div>
        <div className="ireq-meta">
          <span className={`urgency ${(ticket.priority && PRIORITY_CLASS[ticket.priority]) ?? "urgency-medium"}`}>
            {(ticket.priority && PRIORITY_LABEL[ticket.priority]) ?? "Medium"}
          </span>
          <span>•</span>
          <span>{ticket.location}</span>
          <span>•</span>
          <span className="mono">{fmtAge(ticket.createdAt)}</span>
          {ticket.submittedByName && (
            <>
              <span>•</span>
              <span>{ticket.submittedByName}</span>
            </>
          )}
          {ticket.requestedStartAt && (
            <>
              <span>•</span>
              <RequestedTimeChip
                startAt={ticket.requestedStartAt}
                endAt={ticket.requestedEndAt}
              />
            </>
          )}
        </div>
      </div>
      <div className="ireq-actions">
        <button
          className="btn btn-secondary btn-sm"
          disabled={busy}
          onClick={(e) => { e.stopPropagation(); declineMut.mutate(ticket.id); }}
        >
          Decline
        </button>
        <button
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={(e) => { e.stopPropagation(); confirmMut.mutate(ticket.id); }}
        >
          {confirmMut.isPending ? "Confirming…" : ticket.requestedStartAt ? "Confirm & schedule →" : "Accept →"}
        </button>
      </div>
    </div>
  );
}

export function InboundRequests() {
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();

  const pending = tickets.filter((t) => t.status === "PENDING_APPROVAL");

  return (
    <>
      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">Inbound requests</span>
        <span className="rule" />
        {!isLoading && (
          <span className="mono muted" style={{ fontSize: 11 }}>
            {pending.length} waiting
          </span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 32, padding: 0 }}>
        {isLoading && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            Loading requests…
          </div>
        )}
        {!isLoading && pending.length === 0 && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            No pending requests.
          </div>
        )}
        {pending.map((t) => (
          <InboundRow key={t.id} ticket={t} />
        ))}
      </div>
    </>
  );
}
