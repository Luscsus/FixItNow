import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";
import { useAcceptTicketMutation } from "@/hooks/useAcceptTicketMutation";
import { useConfirmTicketMutation, useDeclineTicketMutation } from "@/hooks/useConfirmTicketMutation";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { useOpenTicketsQuery } from "@/hooks/useOpenTicketsQuery";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import { Link } from "react-router-dom";

const ACTIVE_STATUSES: TicketStatus[] = ["APPROVED", "IN_TRANSIT", "PENDING_PROVIDER_INVOICE", "PENDING_PAYMENT"];

function priorityClass(p: TicketPriority | null): string {
  return p === "CRITICAL" ? "critical" : p === "HIGH" ? "high" : p === "MEDIUM" ? "medium" : "low";
}

function userInitials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name.trim().split(" ");
  return (parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "");
}

function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return "just now";
  if (diffMin < 60) return `${diffMin} min ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} hr ago`;
  return `${Math.floor(diffHr / 24)} days ago`;
}

function formatId(id: number): string {
  return "FIX-" + String(id).padStart(4, "0");
}

function pad(n: number) { return String(n).padStart(2, "0"); }
function fmtTime(d: Date) { return d.getMinutes() === 0 ? `${d.getHours()}:00` : `${d.getHours()}:${pad(d.getMinutes())}`; }
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const WDAYS  = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

function RequestedTimeChip({ startAt, endAt }: { startAt: Date; endAt: Date | null | undefined }) {
  const timeRange = endAt ? `${fmtTime(startAt)}–${fmtTime(endAt)}` : fmtTime(startAt);
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "var(--font-mono)", background: "var(--amber-50)", color: "var(--amber-700)", border: "1px solid var(--amber-100)", borderRadius: 5, padding: "2px 8px" }}>
      🕐 {WDAYS[startAt.getDay()]} {MONTHS[startAt.getMonth()]} {startAt.getDate()} · {timeRange}
    </span>
  );
}

interface RequestCardProps {
  ticket: Ticket;
  onAccept: () => void;
  onDecline?: () => void;
  acceptLabel?: string;
  isPending?: boolean;
}

function RequestCard({ ticket, onAccept, onDecline, acceptLabel = "Accept →", isPending }: RequestCardProps) {
  const pc = priorityClass(ticket.priority);
  return (
    <div className={`req-card u-${pc}`}>
      <div className="req-rail" />
      <div className="req-card-inner">
        <div className="req-head">
          <span className="rid">{formatId(ticket.id)}</span>
          <span className="rcat">· {ticket.serviceType}</span>
          <span className="grow" />
          <span className={`urgency urgency-${pc}`}>
            {ticket.priority ? ticket.priority.charAt(0) + ticket.priority.slice(1).toLowerCase() : "—"}
          </span>
        </div>
        <h3 className="req-title">{ticket.serviceType}</h3>
        <div className="req-where">
          {ticket.location && (
            <>
              <span className="req-pin">📍 {ticket.location}</span>
              <span>·</span>
            </>
          )}
          <span className="mono" style={{ fontSize: 12 }}>
            {timeAgo(ticket.createdAt)}
          </span>
          {ticket.requestedStartAt && (
            <>
              <span>·</span>
              <RequestedTimeChip startAt={ticket.requestedStartAt} endAt={ticket.requestedEndAt} />
            </>
          )}
        </div>
        <div className="req-customer">
          <div
            className="req-cust-av"
            style={{ background: "oklch(0.6 0.06 220)" }}
          >
            {userInitials(ticket.submittedByName).toUpperCase() || "?"}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="req-cust-name">{ticket.submittedByName ?? "Unknown user"}</div>
            <div
              className="req-cust-meta"
              style={{
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                maxWidth: "100%",
              }}
            >
              {ticket.description}
            </div>
          </div>
        </div>
        <div className="req-actions">
          <span className="grow" />
          {onDecline && (
            <button
              className="btn btn-secondary btn-sm"
              type="button"
              onClick={onDecline}
              disabled={isPending}
            >
              Decline
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={onAccept}
            disabled={isPending}
          >
            {isPending ? "…" : acceptLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function ActiveJobCard({ ticket }: { ticket: Ticket }) {
  const pc = priorityClass(ticket.priority);

  const statusLabel: Record<TicketStatus, string> = {
    APPROVED: "Accepted",
    IN_TRANSIT: "En route",
    PENDING_PROVIDER_INVOICE: "Awaiting invoice",
    PENDING_PAYMENT: "Awaiting payment",
    PENDING_APPROVAL: "Pending",
    DECLINED: "Declined",
    COMPLETED: "Completed",
    CANCELLED: "Cancelled",
  };

  return (
    <div className={`job-card in-progress`}>
      <div className="job-rail" />
      <div className="job-body">
        <div className="job-head">
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em" }}>
            {formatId(ticket.id)}
          </span>
          <span className="mono muted" style={{ fontSize: 11, letterSpacing: "0.06em", textTransform: "uppercase" }}>
            · {ticket.serviceType}
          </span>
          <span className="grow" />
          <span className={`pill pill-inprogress`}>
            <span className="dot" /> {statusLabel[ticket.status] ?? ticket.status}
          </span>
        </div>
        <h3 className="req-title">{ticket.serviceType}</h3>
        <div className="job-meta">
          <span>{ticket.submittedByName ?? "—"}</span>
          {ticket.location && (
            <>
              <span>·</span>
              <span>{ticket.location}</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ProviderDashboardPage() {
  const { data: provider } = useCurrentProvider();
  const { data: providerTickets = [], isLoading: loadingProvider } = useProviderTicketsQuery();
  const { data: openTickets = [], isLoading: loadingOpen } = useOpenTicketsQuery();

  const updateStatus = useUpdateTicketStatusMutation();
  const confirmMut = useConfirmTicketMutation();
  const declineMut = useDeclineTicketMutation();
  const acceptOpen = useAcceptTicketMutation();

  const inboundTickets = providerTickets.filter((t) => t.status === "PENDING_APPROVAL");
  const activeJobs = providerTickets.filter((t) => (ACTIVE_STATUSES as string[]).includes(t.status));

  const providerName = provider
    ? [provider.firstName, provider.lastName].filter(Boolean).join(" ") || provider.email
    : "Provider";
  const firstName = provider?.firstName ?? "there";

  return (
    <div>
      {/* ── Hero band ── */}
      <section className="dash-hero">
        <div className="dash-hero-grid" />
        <div className="container dash-hero-inner">
          <div className="hero-top">
            <div>
              <span className="eyebrow" style={{ color: "var(--amber-500)" }}>
                Provider dashboard · {providerName}
              </span>
              <h1 className="dash-hero-headline">
                {inboundTickets.length > 0 ? (
                  <>
                    You&apos;ve got{" "}
                    <b>
                      {inboundTickets.length} inbound request
                      {inboundTickets.length !== 1 ? "s" : ""}
                    </b>
                    {activeJobs.length > 0 && (
                      <>
                        {" "}and <b>{activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}</b>
                      </>
                    )}.
                  </>
                ) : activeJobs.length > 0 ? (
                  <>
                    You have <b>{activeJobs.length} active job{activeJobs.length !== 1 ? "s" : ""}</b> in progress.
                  </>
                ) : (
                  <>
                    Welcome back, <b>{firstName}</b>. No requests right now.
                  </>
                )}
              </h1>
            </div>

            <div className="status-pod">
              <span className="status-pulse" />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                  Online · accepting
                </div>
                <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 500, marginTop: 2, letterSpacing: "-0.01em" }}>
                  {openTickets.length} open ticket{openTickets.length !== 1 ? "s" : ""} available
                </div>
              </div>
            </div>
          </div>

          <div className="hero-stats" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
            <div className="hstat warn">
              <div className="hstat-label">Requests waiting</div>
              <div className="hstat-num">{String(inboundTickets.length).padStart(2, "0")}</div>
              <div className="hstat-hint">assigned to you · PENDING_APPROVAL</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">Active jobs</div>
              <div className="hstat-num">{String(activeJobs.length).padStart(2, "0")}</div>
              <div className="hstat-hint">in progress</div>
            </div>
            <div className="hstat accent">
              <div className="hstat-label">Open to anyone</div>
              <div className="hstat-num">{String(openTickets.length).padStart(2, "0")}</div>
              <div className="hstat-hint">no provider assigned yet</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container page-area">

        {/* ── Panel 01: Inbound requests ── */}
        <div className="panel-title">
          <span className="num">01</span>
          <span className="label">Inbound requests</span>
          <span className="rule" />
          <span className="mono" style={{ fontSize: 11, color: "var(--amber-700)", background: "var(--amber-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
            {inboundTickets.length} WAITING
          </span>
        </div>

        {loadingProvider ? (
          <div style={{ padding: "32px 0", color: "var(--slate-400)" }}>Loading requests…</div>
        ) : inboundTickets.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 48 }}>
            <div style={{ fontSize: 15, color: "var(--slate-500)" }}>No inbound requests at the moment.</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Tickets assigned specifically to you will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
            {inboundTickets.map((ticket) => (
              <RequestCard
                key={ticket.id}
                ticket={ticket}
                acceptLabel={ticket.requestedStartAt ? "Confirm & schedule →" : "Accept →"}
                isPending={confirmMut.isPending || declineMut.isPending || updateStatus.isPending}
                onAccept={() => ticket.requestedStartAt
                  ? confirmMut.mutate(ticket.id)
                  : updateStatus.mutate({ ticketId: ticket.id, status: "APPROVED" })}
                onDecline={() => declineMut.mutate(ticket.id)}
              />
            ))}
          </div>
        )}

        {/* ── Panel 02: Active jobs ── */}
        {activeJobs.length > 0 && (
          <>
            <div className="panel-title">
              <span className="num">02</span>
              <span className="label">Active jobs</span>
              <span className="rule" />
              <span className="mono muted" style={{ fontSize: 11 }}>{activeJobs.length} IN PROGRESS</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
              {activeJobs.map((ticket) => (
                <ActiveJobCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
          </>
        )}

        {/* ── Panel 03: Open to anyone ── */}
        <div className="panel-title">
          <span className="num">{activeJobs.length > 0 ? "03" : "02"}</span>
          <span className="label">Open to anyone</span>
          <span className="rule" />
          <span className="mono" style={{ fontSize: 11, color: "var(--blue-700)", background: "var(--blue-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
            {openTickets.length} AVAILABLE
          </span>
        </div>

        {loadingOpen ? (
          <div style={{ padding: "32px 0", color: "var(--slate-400)" }}>Loading open tickets…</div>
        ) : openTickets.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 48 }}>
            <div style={{ fontSize: 15, color: "var(--slate-500)" }}>No open tickets right now.</div>
            <div className="muted" style={{ fontSize: 13, marginTop: 6 }}>Tickets open to all providers will appear here.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 48 }}>
            {openTickets.map((ticket) => (
              <RequestCard
                key={ticket.id}
                ticket={ticket}
                acceptLabel="Accept & assign →"
                isPending={acceptOpen.isPending}
                onAccept={() => {
                  try {
                    acceptOpen.mutate(ticket.id);
                  } catch {
                    // handled by mutation state
                  }
                }}
              />
            ))}
          </div>
        )}

        {/* ── Pro tip ── */}
        <div className="pulse-card" style={{ marginTop: 16, background: "var(--amber-50)", borderColor: "var(--amber-100)" }}>
          <span className="eyebrow-plain" style={{ color: "var(--amber-700)" }}>Pro tip · grow your business</span>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0", color: "var(--amber-700)" }}>
            Respond to inbound requests quickly to build your reputation. Accepted tickets move to your active jobs automatically.
          </p>
        </div>

      </main>
    </div>
  );
}
