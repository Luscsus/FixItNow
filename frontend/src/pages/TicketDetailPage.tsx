import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTicketQuery } from "@/hooks/useTicketQuery";
import { useAuth } from "@/context/auth";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import { TicketChatPanel } from "@/components/ticket/TicketChatPanel";
import { IssueInvoicePanel } from "@/components/ticket/IssueInvoicePanel";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";
import type {
  Ticket,
  TicketPriority,
  TicketStatus,
  StatusHistoryEntry,
} from "@/domain/ticket";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(d: Date): string {
  return d.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function fmtDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function initials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function priorityBadgeClass(priority: TicketPriority | null) {
  if (priority === "CRITICAL") return "urgency urgency-critical";
  if (priority === "HIGH") return "urgency urgency-high";
  if (priority === "MEDIUM") return "urgency urgency-medium";
  return "urgency urgency-low";
}

function priorityLabel(priority: TicketPriority | null) {
  if (priority === "CRITICAL") return "Critical";
  if (priority === "HIGH") return "High";
  if (priority === "MEDIUM") return "Medium";
  return "Low";
}

// ─── Phase rail ───────────────────────────────────────────────────────────────

const STEPS: { label: string; status: TicketStatus }[] = [
  { label: "Pending Approval", status: "PENDING_APPROVAL" },
  { label: "Approved", status: "APPROVED" },
  { label: "In Transit", status: "IN_TRANSIT" },
  { label: "Pending Provider Invoice", status: "PENDING_PROVIDER_INVOICE" },
  { label: "Pending Payment", status: "PENDING_PAYMENT" },
  { label: "Completed", status: "COMPLETED" },
];

const STATUS_ORDER: TicketStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
  "COMPLETED",
];

const NEXT_STATUS: Partial<
  Record<TicketStatus, { status: TicketStatus; label: string }>
> = {
  APPROVED: { status: "IN_TRANSIT", label: "Mark as In Transit →" },
  IN_TRANSIT: {
    status: "PENDING_PROVIDER_INVOICE",
    label: "Mark as Work Complete →",
  },
  // PENDING_PROVIDER_INVOICE is handled by IssueInvoicePanel — not a simple button
};

function stepState(
  stepStatus: TicketStatus,
  ticketStatus: TicketStatus,
): "done" | "current" | "pending" {
  const stepIdx = STATUS_ORDER.indexOf(stepStatus);
  const ticketIdx = STATUS_ORDER.indexOf(ticketStatus);
  if (ticketIdx > stepIdx) return "done";
  if (ticketIdx === stepIdx) return "current";
  return "pending";
}

function statusPill(status: TicketStatus): {
  label: string;
  pillClass: string;
} {
  switch (status) {
    case "PENDING_APPROVAL":
      return { label: "Awaiting provider", pillClass: "pill-pending" };
    case "APPROVED":
      return { label: "Accepted", pillClass: "pill-assigned" };
    case "IN_TRANSIT":
      return { label: "On site", pillClass: "pill-enroute" };
    case "PENDING_PROVIDER_INVOICE":
      return { label: "Pending invoice", pillClass: "pill-inprogress" };
    case "PENDING_PAYMENT":
      return { label: "Pending payment", pillClass: "pill-inprogress" };
    case "COMPLETED":
      return { label: "Completed", pillClass: "pill-resolved" };
    case "DECLINED":
      return { label: "Declined", pillClass: "pill-closed" };
    case "CANCELLED":
      return { label: "Cancelled", pillClass: "pill-closed" };
    default:
      return { label: status, pillClass: "pill-pending" };
  }
}

function headlineText(
  ticket: Ticket,
  isProvider: boolean,
): { main: string; highlight: string | null } {
  const name = ticket.assignedServiceProviderName;
  switch (ticket.status) {
    case "PENDING_APPROVAL":
      return isProvider
        ? { main: "A new ticket is waiting for acceptance.", highlight: null }
        : {
            main: "Waiting for a provider to accept your ticket.",
            highlight: null,
          };
    case "APPROVED":
      return isProvider
        ? {
            main: "You have accepted this ticket.",
            highlight: "Scheduling in progress.",
          }
        : {
            main: name
              ? `${name} has accepted your ticket.`
              : "A provider has accepted your ticket.",
            highlight: "Scheduling in progress.",
          };
    case "IN_TRANSIT":
      return isProvider
        ? {
            main: "You're on your way.",
            highlight: "The customer is waiting for you.",
          }
        : {
            main: name
              ? `${name} is on the way.`
              : "Your provider is on the way.",
            highlight: null,
          };
    case "PENDING_PROVIDER_INVOICE":
      return {
        main: "Work is complete.",
        highlight: "Waiting for the invoice.",
      };
    case "PENDING_PAYMENT":
      return { main: "Invoice received.", highlight: "Payment pending." };
    case "COMPLETED":
      return { main: "Ticket resolved and closed.", highlight: null };
    case "DECLINED":
      return { main: "Your ticket was declined.", highlight: null };
    case "CANCELLED":
      return { main: "This ticket has been cancelled.", highlight: null };
    default:
      return { main: ticket.serviceType, highlight: null };
  }
}

// ─── Activity log entries ─────────────────────────────────────────────────────

type LogEntry = {
  time: string;
  date: string;
  text: React.ReactNode;
};

const STATUS_EVENT_LABEL: Record<TicketStatus, string> = {
  PENDING_APPROVAL: "Ticket filed and awaiting provider.",
  APPROVED: "Provider accepted — ticket approved.",
  IN_TRANSIT: "Provider marked as in transit.",
  PENDING_PROVIDER_INVOICE: "Work completed — awaiting invoice.",
  PENDING_PAYMENT: "Invoice received — payment pending.",
  COMPLETED: "Ticket resolved and closed.",
  DECLINED: "Ticket was declined.",
  CANCELLED: "Ticket was cancelled.",
};

function buildActivityLog(ticket: Ticket): LogEntry[] {
  const history: StatusHistoryEntry[] = ticket.statusHistory ?? [];

  if (history.length > 0) {
    return [...history].reverse().map((entry) => ({
      time: fmt(entry.changedAt),
      date: fmtDate(entry.changedAt),
      text: (
        <>
          <b style={{ textTransform: "capitalize" }}>
            {entry.status.replace(/_/g, " ").toLowerCase()}
          </b>
          {" — "}
          {STATUS_EVENT_LABEL[entry.status] ?? entry.status}
        </>
      ),
    }));
  }

  // Fallback for tickets with no history yet
  return [
    {
      time: fmt(ticket.createdAt),
      date: fmtDate(ticket.createdAt),
      text: (
        <>
          <b>{ticket.submittedByName ?? "You"}</b> filed{" "}
          <b>FIX-{String(ticket.id).padStart(4, "0")}</b> — {ticket.serviceType}
          .
        </>
      ),
    },
  ];
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function PhaseRail({ ticketStatus }: { ticketStatus: TicketStatus }) {
  return (
    <div className="steprail" style={{ marginTop: 28 }}>
      <div className="steprail-bars">
        {STEPS.map((step) => {
          const state = stepState(step.status, ticketStatus);
          return (
            <span
              key={step.status}
              className={`steprail-bar${state === "done" ? " done" : state === "current" ? " current" : ""}`}
              style={
                state === "pending"
                  ? { background: "rgba(255,255,255,0.12)" }
                  : undefined
              }
            />
          );
        })}
      </div>
      <div className="steprail-labels">
        {STEPS.map((step) => {
          const state = stepState(step.status, ticketStatus);
          const color =
            state === "done"
              ? "var(--emerald-400)"
              : state === "current"
                ? "var(--amber-400)"
                : "rgba(255,255,255,0.4)";
          return (
            <span key={step.status} style={{ color }}>
              {step.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}

function MetaCard({ ticket }: { ticket: Ticket }) {
  const providerPic = ticket.assignedServiceProviderProfilePictureUrl ?? null;
  const submitterPic = ticket.submittedByProfilePictureUrl ?? null;

  const cells = [
    {
      label: "Provider",
      value: ticket.assignedServiceProviderName ? (
        ticket.assignedServiceProviderId ? (
          <Link
            to={`/providers/${ticket.assignedServiceProviderId}`}
            className="row gap-8"
            style={{ marginTop: 8, textDecoration: "none", color: "inherit" }}
          >
            <div
              className="avatar"
              style={{
                width: 28,
                height: 28,
                fontSize: 11,
                background: "var(--navy-900)",
                color: "var(--amber-500)",
                ...(providerPic ? { padding: 0, overflow: "hidden" } : {}),
              }}
            >
              {providerPic ? (
                <img
                  src={providerPic}
                  alt={ticket.assignedServiceProviderName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                initials(ticket.assignedServiceProviderName)
              )}
            </div>
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                letterSpacing: "-0.01em",
              }}
            >
              {ticket.assignedServiceProviderName}
            </span>
          </Link>
        ) : (
          <div className="row gap-8" style={{ marginTop: 8 }}>
            <div
              className="avatar"
              style={{
                width: 28,
                height: 28,
                fontSize: 11,
                background: "var(--navy-900)",
                color: "var(--amber-500)",
                ...(providerPic ? { padding: 0, overflow: "hidden" } : {}),
              }}
            >
              {providerPic ? (
                <img
                  src={providerPic}
                  alt={ticket.assignedServiceProviderName}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
              ) : (
                initials(ticket.assignedServiceProviderName)
              )}
            </div>
            <span
              style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}
            >
              {ticket.assignedServiceProviderName}
            </span>
          </div>
        )
      ) : (
        <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)" }}>
          Unassigned
        </div>
      ),
      mini: null,
    },
    {
      label: "Location",
      value: (
        <div style={{ marginTop: 6, fontSize: 15, fontWeight: 500 }}>
          {ticket.location || "—"}
        </div>
      ),
      mini: ticket.category.replace(/_/g, " "),
    },
    {
      label: "Submitted by",
      value: (
        <>
          {ticket.submittedByName && (
            <div className="row gap-8" style={{ marginTop: 8 }}>
              <div
                className="avatar"
                style={{
                  width: 28,
                  height: 28,
                  fontSize: 11,
                  background: "var(--navy-900)",
                  color: "var(--amber-500)",
                  ...(submitterPic ? { padding: 0, overflow: "hidden" } : {}),
                }}
              >
                {submitterPic ? (
                  <img
                    src={submitterPic}
                    alt={ticket.submittedByName}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                ) : (
                  initials(ticket.submittedByName)
                )}
              </div>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 600,
                  letterSpacing: "-0.01em",
                }}
              >
                {ticket.submittedByName}
              </span>
            </div>
          )}
          <div
            className="mono"
            style={{ marginTop: 6, fontSize: 14, letterSpacing: "0.02em" }}
          >
            {fmt(ticket.createdAt)}
          </div>
        </>
      ),
      mini: fmtDate(ticket.createdAt),
    },
    {
      label: "Quoted",
      value: (
        <div
          className="mono"
          style={{ marginTop: 6, fontSize: 14, letterSpacing: "0.02em" }}
        >
          {ticket.estimatedCost != null
            ? `$${ticket.estimatedCost.toFixed(2)}`
            : "—"}
        </div>
      ),
      mini: ticket.estimatedCost != null ? "estimated cost" : "not yet quoted",
    },
  ];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(4, 1fr)",
        background: "var(--card)",
        border: "1px solid var(--border)",
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 24,
        boxShadow: "var(--shadow-sm)",
      }}
    >
      {cells.map((cell, i) => (
        <div
          key={i}
          style={{
            padding: "18px 22px",
            borderLeft: i === 0 ? "none" : "1px solid var(--border)",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 10.5,
              color: "var(--text-muted)",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              fontWeight: 600,
            }}
          >
            {cell.label}
          </div>
          {cell.value}
          {cell.mini && (
            <div
              style={{
                fontSize: 11.5,
                color: "var(--text-muted)",
                marginTop: 4,
              }}
            >
              {cell.mini}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function ActivityLog({ entries }: { entries: LogEntry[] }) {
  return (
    <div className="card card-pad">
      {entries.map((entry, i) => (
        <div
          key={i}
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: 16,
            padding: "18px 0",
            borderBottom:
              i < entries.length - 1 ? "1px solid var(--border)" : "none",
          }}
        >
          <div
            className="mono"
            style={{
              fontSize: 11,
              color: "var(--text-muted)",
              letterSpacing: "0.06em",
              paddingTop: 3,
              lineHeight: 1.6,
            }}
          >
            <div>{entry.date}</div>
            <div style={{ color: "var(--text-muted)", opacity: 0.7 }}>
              {entry.time}
            </div>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{entry.text}</div>
        </div>
      ))}
    </div>
  );
}

// ─── Image gallery + lightbox ─────────────────────────────────────────────────

function ImageGallery({ urls }: { urls: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight") setLightboxIdx((i) => (i !== null ? Math.min(i + 1, urls.length - 1) : null));
      if (e.key === "ArrowLeft")  setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : null));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, urls.length]);

  const navBtn: React.CSSProperties = {
    position: "absolute", top: "50%", transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.12)", border: "none", color: "#fff",
    borderRadius: 8, width: 44, height: 44, fontSize: 20, cursor: "pointer",
    display: "grid", placeItems: "center", backdropFilter: "blur(4px)",
  };

  return (
    <>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: 10 }}>
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            style={{ border: "1px solid var(--border)", padding: 0, borderRadius: 10, overflow: "hidden", aspectRatio: "1", cursor: "zoom-in", background: "var(--slate-100)", transition: "opacity 0.15s" }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <img src={url} alt={`Photo ${i + 1}`} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          role="dialog" aria-modal="true" aria-label="Image viewer"
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.9)", zIndex: 1000, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={urls[lightboxIdx]} alt={`Photo ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "min(90vw, 1100px)", maxHeight: "80vh", objectFit: "contain", borderRadius: 10, boxShadow: "0 24px 64px rgba(0,0,0,0.6)", userSelect: "none" }}
          />
          <div style={{ marginTop: 14, color: "rgba(255,255,255,0.5)", fontSize: 12, fontFamily: "var(--font-mono)", letterSpacing: "0.08em" }}>
            {lightboxIdx + 1} / {urls.length}
          </div>
          {lightboxIdx > 0 && (
            <button style={{ ...navBtn, left: 20 }} onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx - 1); }} aria-label="Previous image">‹</button>
          )}
          {lightboxIdx < urls.length - 1 && (
            <button style={{ ...navBtn, right: 20 }} onClick={(e) => { e.stopPropagation(); setLightboxIdx(lightboxIdx + 1); }} aria-label="Next image">›</button>
          )}
          <button
            onClick={() => setLightboxIdx(null)} aria-label="Close"
            style={{ position: "absolute", top: 18, right: 22, background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", borderRadius: 8, width: 36, height: 36, fontSize: 18, cursor: "pointer", display: "grid", placeItems: "center", backdropFilter: "blur(4px)" }}
          >✕</button>
        </div>
      )}
    </>
  );
}


// ─── Main page ────────────────────────────────────────────────────────────────

export function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = id ? parseInt(id, 10) : NaN;
  const { role } = useAuth();
  const updateMut = useUpdateTicketStatusMutation();

  const { data: ticket, isLoading, isError } = useTicketQuery(ticketId);

  if (isLoading) {
    return (
      <div
        style={{
          padding: "80px 0",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Loading ticket…
      </div>
    );
  }

  if (isError || !ticket) {
    return (
      <div
        style={{
          padding: "80px 0",
          textAlign: "center",
          color: "var(--text-muted)",
        }}
      >
        Ticket not found.{" "}
        <Link
          to="/dashboard/user"
          style={{ color: "var(--navy-700)", fontWeight: 600 }}
        >
          Back to dashboard
        </Link>
      </div>
    );
  }

  const ticketIdStr = `FIX-${String(ticket.id).padStart(4, "0")}`;
  const pill = statusPill(ticket.status);
  const isProvider = role === "PROVIDER";
  const headline = headlineText(ticket, isProvider);
  const activityEntries = buildActivityLog(ticket);
  const isTerminal =
    ticket.status === "DECLINED" || ticket.status === "CANCELLED";
  const nextStatus = isProvider ? NEXT_STATUS[ticket.status] : undefined;

  return (
    <>
      <style>{`
        @keyframes livesweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes livepulse2 {
          0%   { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.2); opacity: 0; }
        }
      `}</style>

      {/* ── Live header ── */}
      <section
        style={{
          background: "var(--navy-900)",
          backgroundImage:
            "radial-gradient(ellipse at 90% 0%, rgba(245,158,11,0.2), transparent 55%)",
          color: "#fff",
          padding: "28px 0 36px",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* grid overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
            pointerEvents: "none",
          }}
        />

        <div className="container" style={{ position: "relative" }}>
          {/* Breadcrumb + live badge */}
          <div
            className="row"
            style={{ marginBottom: 6, gap: 16, flexWrap: "wrap" }}
          >
            <Link
              to="/dashboard/user"
              className="mono"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 11.5,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              ← Dashboard
            </Link>
            <span
              className="mono"
              style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}
            >
              /
            </span>
            <span
              className="mono"
              style={{
                color: "rgba(255,255,255,0.85)",
                fontSize: 11.5,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
              }}
            >
              {ticketIdStr}
            </span>
            <span className="grow" />
            {!isTerminal && (
              <span
                className="mono"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: 11,
                  color: "var(--amber-500)",
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    position: "relative",
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    background: "var(--amber-500)",
                    display: "inline-block",
                  }}
                >
                  <span
                    style={{
                      position: "absolute",
                      inset: -4,
                      borderRadius: 8,
                      background: "var(--amber-500)",
                      opacity: 0.4,
                      animation: "livepulse2 1.6s ease-out infinite",
                    }}
                  />
                </span>
                Live
              </span>
            )}
          </div>

          {/* Urgency + status pill + category */}
          <div
            className="row"
            style={{
              gap: 14,
              alignItems: "baseline",
              flexWrap: "wrap",
              marginTop: 4,
            }}
          >
            <span
              className={priorityBadgeClass(ticket.priority)}
              style={{ height: 24, fontSize: 11, padding: "4px 9px" }}
            >
              {priorityLabel(ticket.priority)}
            </span>
            <span className={`pill ${pill.pillClass}`} style={{ fontSize: 12 }}>
              <span className="dot" />
              {pill.label}
            </span>
            <span
              className="mono"
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: 12,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              {ticket.category.replace(/_/g, " ")}
              {ticket.location ? ` · ${ticket.location}` : ""}
            </span>
          </div>

          {/* Headline */}
          <h1
            style={{
              fontSize: "clamp(28px, 3vw, 40px)",
              fontWeight: 700,
              letterSpacing: "-0.025em",
              lineHeight: 1.1,
              margin: "14px 0 0",
              color: "#fff",
              maxWidth: 920,
            }}
          >
            {headline.main}{" "}
            {headline.highlight && (
              <span style={{ color: "var(--amber-500)" }}>
                {headline.highlight}
              </span>
            )}
          </h1>

          {/* Phase rail */}
          {!isTerminal && <PhaseRail ticketStatus={ticket.status} />}

          {/* Terminal state indicator */}
          {isTerminal && (
            <div style={{ marginTop: 20 }}>
              <span
                className="pill"
                style={{
                  background:
                    ticket.status === "DECLINED"
                      ? "rgba(185,28,28,0.25)"
                      : "rgba(100,116,139,0.25)",
                  color:
                    ticket.status === "DECLINED"
                      ? "#FCA5A5"
                      : "rgba(255,255,255,0.6)",
                  fontSize: 13,
                  padding: "6px 14px",
                }}
              >
                <span
                  className="dot"
                  style={{
                    background:
                      ticket.status === "DECLINED"
                        ? "#FCA5A5"
                        : "rgba(255,255,255,0.4)",
                  }}
                />
                {ticket.status === "DECLINED"
                  ? "Ticket declined"
                  : "Ticket cancelled"}
              </span>
            </div>
          )}
        </div>
      </section>

      {/* ── Body ── */}
      <main
        className="container"
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 360px",
          gap: 24,
          padding: "24px 32px 64px",
          maxWidth: 1280,
          margin: "0 auto",
        }}
      >
        {/* Left column */}
        <div>
          {/* Meta card */}
          <MetaCard ticket={ticket} />

          {/* Description */}
          <div className="panel-title">
            <span className="num">01</span>
            <span className="label">What&apos;s broken</span>
            <span className="rule" />
          </div>
          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.6,
                margin: 0,
                color: "var(--text)",
              }}
            >
              {ticket.description || "No description provided."}
            </p>
            {(ticket.requestedStartAt || ticket.requestedEndAt) && (
              <div
                style={{
                  marginTop: 16,
                  paddingTop: 16,
                  borderTop: "1px solid var(--border)",
                  display: "flex",
                  gap: 24,
                  flexWrap: "wrap",
                }}
              >
                {ticket.requestedStartAt && (
                  <div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Requested start
                    </div>
                    <div className="mono" style={{ fontSize: 14 }}>
                      {fmtDate(ticket.requestedStartAt)} ·{" "}
                      {fmt(ticket.requestedStartAt)}
                    </div>
                  </div>
                )}
                {ticket.requestedEndAt && (
                  <div>
                    <div
                      className="mono"
                      style={{
                        fontSize: 10.5,
                        color: "var(--text-muted)",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        fontWeight: 600,
                        marginBottom: 4,
                      }}
                    >
                      Requested end
                    </div>
                    <div className="mono" style={{ fontSize: 14 }}>
                      {fmtDate(ticket.requestedEndAt)} ·{" "}
                      {fmt(ticket.requestedEndAt)}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Photos */}
          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <>
              <div className="panel-title">
                <span className="num">02</span>
                <span className="label">Photos</span>
                <span className="rule" />
                <span className="mono muted" style={{ fontSize: 11 }}>
                  {ticket.imageUrls.length} attached
                </span>
              </div>
              <div className="card card-pad" style={{ marginBottom: 32 }}>
                <ImageGallery urls={ticket.imageUrls} />
              </div>
            </>
          )}

          {/* Activity log */}
          <div className="panel-title">
            <span className="num">
              {ticket.imageUrls && ticket.imageUrls.length > 0 ? "03" : "02"}
            </span>
            <span className="label">Activity</span>
            <span className="rule" />
            <span className="mono muted" style={{ fontSize: 11 }}>
              {activityEntries.length} events
            </span>
          </div>
          <ActivityLog entries={activityEntries} />

          {/* Issue Invoice panel — provider only, when work is done */}
          {isProvider && ticket.status === "PENDING_PROVIDER_INVOICE" && (
            <div style={{ marginTop: 28 }}>
              <IssueInvoicePanel ticket={ticket} />
            </div>
          )}

          {/* Download Invoice button — visible once invoice has been issued */}
          {(ticket.status === "PENDING_PAYMENT" || ticket.status === "COMPLETED") &&
            ticket.estimatedCost != null && (
              <div style={{ marginTop: 16 }}>
                <button
                  className="btn btn-secondary"
                  onClick={async () => {
                    const blob = await generateInvoicePdf({
                      ticketCode: `FIX-${String(ticket.id).padStart(4, "0")}`,
                      serviceType: ticket.serviceType,
                      category: ticket.category,
                      description: ticket.description,
                      location: ticket.location ?? "",
                      providerName: ticket.assignedServiceProviderName ?? "Provider",
                      customerName: ticket.submittedByName ?? "Customer",
                      amount: ticket.estimatedCost!,
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Invoice-FIX-${String(ticket.id).padStart(4, "0")}.pdf`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 60_000);
                  }}
                >
                  ↓ Download Invoice PDF
                </button>
              </div>
            )}

          {/* Actions */}
          <div
            className="row"
            style={{ marginTop: 28, gap: 12, flexWrap: "wrap" }}
          >
            <button
              className="btn btn-secondary"
              onClick={() => navigate("/dashboard/user")}
            >
              ← Back to dashboard
            </button>
            <span className="grow" />
            {nextStatus && (
              <button
                className="btn btn-primary"
                disabled={updateMut.isPending}
                onClick={() =>
                  updateMut.mutate({
                    ticketId: ticket.id,
                    status: nextStatus.status,
                  })
                }
              >
                {updateMut.isPending ? "Updating…" : nextStatus.label}
              </button>
            )}
            {!isTerminal && role !== "PROVIDER" && (
              <button className="btn btn-danger" disabled title="Coming soon">
                Cancel ticket
              </button>
            )}
          </div>
        </div>

        {/* Right column: chat */}
        <aside>
          <TicketChatPanel ticket={ticket} />
        </aside>
      </main>
    </>
  );
}
