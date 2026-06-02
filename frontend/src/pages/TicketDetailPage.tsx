import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { useTicketQuery } from "@/hooks/useTicketQuery";
import { useAuth } from "@/context/auth";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import { useAcceptTicketMutation } from "@/hooks/useAcceptTicketMutation";
import {
  useConfirmTicketMutation,
  useDeclineTicketMutation,
} from "@/hooks/useConfirmTicketMutation";
import { useCancelTicketMutation } from "@/hooks/useCancelTicketMutation";
import { TicketChatPanel } from "@/components/ticket/TicketChatPanel";
import { IssueInvoicePanel } from "@/components/ticket/IssueInvoicePanel";
import { LiveTrackingPanel } from "@/components/tracking/LiveTrackingPanel";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { generateInvoicePdf } from "@/utils/generateInvoicePdf";
import type { Ticket, TicketPriority, TicketStatus, StatusHistoryEntry } from "@/domain/ticket";

function fmt(d: Date, locale: string): string {
  return d.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit", hour12: false });
}
function fmtDate(d: Date, locale: string): string {
  return d.toLocaleDateString(locale, { month: "short", day: "numeric", year: "numeric" });
}
function initials(name: string): string {
  return name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
}

function priorityBadgeClass(priority: TicketPriority | null) {
  if (priority === "CRITICAL") return "urgency urgency-critical";
  if (priority === "HIGH")     return "urgency urgency-high";
  if (priority === "MEDIUM")   return "urgency urgency-medium";
  return "urgency urgency-low";
}
function priorityKey(priority: TicketPriority | null): string {
  const p = (priority ?? "LOW").toLowerCase();
  return `providerAccount.inbound_priority_${p}`;
}

const STATUS_ORDER: TicketStatus[] = [
  "PENDING_APPROVAL", "APPROVED", "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE", "PENDING_PAYMENT", "COMPLETED",
];

function stepState(stepStatus: TicketStatus, ticketStatus: TicketStatus): "done" | "current" | "pending" {
  const si = STATUS_ORDER.indexOf(stepStatus);
  const ti = STATUS_ORDER.indexOf(ticketStatus);
  if (ti > si) return "done";
  if (ti === si) return "current";
  return "pending";
}

function PhaseRail({ ticketStatus, labels }: { readonly ticketStatus: TicketStatus; readonly labels: Record<TicketStatus, string> }) {
  const steps = STATUS_ORDER.filter((s) => s !== "PENDING_PROVIDER_INVOICE" ? true : true).slice(0, 6);
  return (
    <div className="steprail" style={{ marginTop: 28 }}>
      <div className="steprail-bars">
        {steps.map((status) => {
          const state = stepState(status, ticketStatus);
          return (
            <span key={status} className={`steprail-bar${state === "done" ? " done" : state === "current" ? " current" : ""}`}
              style={state === "pending" ? { background: "rgba(255,255,255,0.12)" } : undefined} />
          );
        })}
      </div>
      <div className="steprail-labels">
        {steps.map((status) => {
          const state = stepState(status, ticketStatus);
          const color = state === "done" ? "var(--emerald-400)" : state === "current" ? "var(--amber-400)" : "rgba(255,255,255,0.4)";
          return <span key={status} style={{ color }}>{labels[status]}</span>;
        })}
      </div>
    </div>
  );
}

function MetaCard({ ticket, labels }: { readonly ticket: Ticket; readonly labels: { provider: string; location: string; submittedBy: string; quoted: string; unassigned: string; estimatedCost: string; notYetQuoted: string } }) {
  const { i18n } = useTranslation();
  const locale = i18n.language;
  const providerPic  = ticket.assignedServiceProviderProfilePictureUrl ?? null;
  const submitterPic = ticket.submittedByProfilePictureUrl ?? null;

  const cells = [
    {
      label: labels.provider,
      value: ticket.assignedServiceProviderName ? (
        ticket.assignedServiceProviderId ? (
          <Link to={`/providers/${ticket.assignedServiceProviderId}`} className="row gap-8" style={{ marginTop: 8, textDecoration: "none", color: "inherit" }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--navy-900)", color: "var(--amber-500)", ...(providerPic ? { padding: 0, overflow: "hidden" } : {}) }}>
              {providerPic ? <img src={providerPic} alt={ticket.assignedServiceProviderName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials(ticket.assignedServiceProviderName)}
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{ticket.assignedServiceProviderName}</span>
          </Link>
        ) : (
          <div className="row gap-8" style={{ marginTop: 8 }}>
            <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--navy-900)", color: "var(--amber-500)", ...(providerPic ? { padding: 0, overflow: "hidden" } : {}) }}>
              {providerPic ? <img src={providerPic} alt={ticket.assignedServiceProviderName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials(ticket.assignedServiceProviderName)}
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
          </div>
        )
      ) : (
        <div style={{ marginTop: 8, fontSize: 14, color: "var(--text-muted)" }}>{labels.unassigned}</div>
      ),
      mini: null,
    },
    {
      label: labels.location,
      value: <div style={{ marginTop: 6, fontSize: 15, fontWeight: 500 }}>{ticket.location || "—"}</div>,
      mini: ticket.category.replace(/_/g, " "),
    },
    {
      label: labels.submittedBy,
      value: (
        <>
          {ticket.submittedByName && (
            <div className="row gap-8" style={{ marginTop: 8 }}>
              <div className="avatar" style={{ width: 28, height: 28, fontSize: 11, background: "var(--navy-900)", color: "var(--amber-500)", ...(submitterPic ? { padding: 0, overflow: "hidden" } : {}) }}>
                {submitterPic ? <img src={submitterPic} alt={ticket.submittedByName} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : initials(ticket.submittedByName)}
              </div>
              <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em" }}>{ticket.submittedByName}</span>
            </div>
          )}
          <div className="mono" style={{ marginTop: 6, fontSize: 14, letterSpacing: "0.02em" }}>{fmt(ticket.createdAt, locale)}</div>
        </>
      ),
      mini: fmtDate(ticket.createdAt, locale),
    },
    {
      label: labels.quoted,
      value: <div className="mono" style={{ marginTop: 6, fontSize: 14, letterSpacing: "0.02em" }}>{ticket.estimatedCost != null ? `$${ticket.estimatedCost.toFixed(2)}` : "—"}</div>,
      mini: ticket.estimatedCost != null ? labels.estimatedCost : labels.notYetQuoted,
    },
  ];

  return (
    <div className="ticket-meta-card" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden", marginBottom: 24, boxShadow: "var(--shadow-sm)" }}>
      {cells.map((cell, i) => (
        <div key={i} style={{ padding: "18px 22px", borderLeft: i === 0 ? "none" : "1px solid var(--border)" }}>
          <div className="mono" style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>{cell.label}</div>
          {cell.value}
          {cell.mini && <div style={{ fontSize: 11.5, color: "var(--text-muted)", marginTop: 4 }}>{cell.mini}</div>}
        </div>
      ))}
    </div>
  );
}

type LogEntry = { time: string; date: string; text: React.ReactNode };

function ActivityLog({ entries }: { readonly entries: LogEntry[] }) {
  return (
    <div className="card card-pad">
      {entries.map((entry, i) => (
        <div key={i} style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 16, padding: "18px 0", borderBottom: i < entries.length - 1 ? "1px solid var(--border)" : "none" }}>
          <div className="mono" style={{ fontSize: 11, color: "var(--text-muted)", letterSpacing: "0.06em", paddingTop: 3, lineHeight: 1.6 }}>
            <div>{entry.date}</div>
            <div style={{ color: "var(--text-muted)", opacity: 0.7 }}>{entry.time}</div>
          </div>
          <div style={{ fontSize: 14.5, lineHeight: 1.55 }}>{entry.text}</div>
        </div>
      ))}
    </div>
  );
}

function ImageGallery({ urls }: { readonly urls: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);

  useEffect(() => {
    if (lightboxIdx === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIdx(null);
      if (e.key === "ArrowRight")
        setLightboxIdx((i) =>
          i !== null ? Math.min(i + 1, urls.length - 1) : null,
        );
      if (e.key === "ArrowLeft")
        setLightboxIdx((i) => (i !== null ? Math.max(i - 1, 0) : null));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIdx, urls.length]);

  const navBtn: React.CSSProperties = {
    position: "absolute",
    top: "50%",
    transform: "translateY(-50%)",
    background: "rgba(255,255,255,0.12)",
    border: "none",
    color: "#fff",
    borderRadius: 8,
    width: 44,
    height: 44,
    fontSize: 20,
    cursor: "pointer",
    display: "grid",
    placeItems: "center",
    backdropFilter: "blur(4px)",
  };

  return (
    <>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))",
          gap: 10,
        }}
      >
        {urls.map((url, i) => (
          <button
            key={i}
            onClick={() => setLightboxIdx(i)}
            style={{
              border: "1px solid var(--border)",
              padding: 0,
              borderRadius: 10,
              overflow: "hidden",
              aspectRatio: "1",
              cursor: "zoom-in",
              background: "var(--slate-100)",
              transition: "opacity 0.15s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.82")}
            onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
          >
            <img
              src={url}
              alt={`Photo ${i + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </button>
        ))}
      </div>

      {lightboxIdx !== null && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Image viewer"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.9)",
            zIndex: 1000,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => setLightboxIdx(null)}
        >
          <img
            src={urls[lightboxIdx]}
            alt={`Photo ${lightboxIdx + 1}`}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "min(90vw, 1100px)",
              maxHeight: "80vh",
              objectFit: "contain",
              borderRadius: 10,
              boxShadow: "0 24px 64px rgba(0,0,0,0.6)",
              userSelect: "none",
            }}
          />
          <div
            style={{
              marginTop: 14,
              color: "rgba(255,255,255,0.5)",
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              letterSpacing: "0.08em",
            }}
          >
            {lightboxIdx + 1} / {urls.length}
          </div>
          {lightboxIdx > 0 && (
            <button
              style={{ ...navBtn, left: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx - 1);
              }}
              aria-label="Previous image"
            >
              ‹
            </button>
          )}
          {lightboxIdx < urls.length - 1 && (
            <button
              style={{ ...navBtn, right: 20 }}
              onClick={(e) => {
                e.stopPropagation();
                setLightboxIdx(lightboxIdx + 1);
              }}
              aria-label="Next image"
            >
              ›
            </button>
          )}
          <button
            onClick={() => setLightboxIdx(null)}
            aria-label="Close"
            style={{
              position: "absolute",
              top: 18,
              right: 22,
              background: "rgba(255,255,255,0.1)",
              border: "none",
              color: "#fff",
              borderRadius: 8,
              width: 36,
              height: 36,
              fontSize: 18,
              cursor: "pointer",
              display: "grid",
              placeItems: "center",
              backdropFilter: "blur(4px)",
            }}
          >
            ✕
          </button>
        </div>
      )}
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function TicketDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const ticketId = id ? parseInt(id, 10) : NaN;
  const { role } = useAuth();
  const queryClient = useQueryClient();
  const updateMut  = useUpdateTicketStatusMutation();
  const acceptMut  = useAcceptTicketMutation();
  const confirmMut = useConfirmTicketMutation();
  const declineMut = useDeclineTicketMutation();
  const cancelMut  = useCancelTicketMutation();
  const { notify } = useToast();
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  const { data: ticket, isLoading, isError } = useTicketQuery(ticketId);

  const stepLabels: Record<TicketStatus, string> = {
    PENDING_APPROVAL:       t("ticket.status.PENDING_APPROVAL"),
    APPROVED:               t("ticket.status.APPROVED"),
    IN_TRANSIT:             t("ticket.status.IN_TRANSIT"),
    PENDING_PROVIDER_INVOICE: t("ticket.status.PENDING_PROVIDER_INVOICE"),
    PENDING_PAYMENT:        t("ticket.status.PENDING_PAYMENT"),
    COMPLETED:              t("ticket.status.COMPLETED"),
    DECLINED:               t("ticket.status.COMPLETED"),
    CANCELLED:              t("ticket.status.COMPLETED"),
  };

  const activityLabels: Record<TicketStatus, string> = {
    PENDING_APPROVAL:       t("ticket.activityLog.PENDING_APPROVAL"),
    APPROVED:               t("ticket.activityLog.APPROVED"),
    IN_TRANSIT:             t("ticket.activityLog.IN_TRANSIT"),
    PENDING_PROVIDER_INVOICE: t("ticket.activityLog.PENDING_PROVIDER_INVOICE"),
    PENDING_PAYMENT:        t("ticket.activityLog.PENDING_PAYMENT"),
    COMPLETED:              t("ticket.activityLog.COMPLETED"),
    DECLINED:               t("ticket.activityLog.DECLINED"),
    CANCELLED:              t("ticket.activityLog.CANCELLED"),
  };

  function statusPill(status: TicketStatus): { label: string; pillClass: string } {
    switch (status) {
      case "PENDING_APPROVAL":       return { label: t("ticket.pills.awaitingProvider"), pillClass: "pill-pending" };
      case "APPROVED":               return { label: t("ticket.pills.accepted"),         pillClass: "pill-assigned" };
      case "IN_TRANSIT":             return { label: t("ticket.pills.onSite"),            pillClass: "pill-enroute" };
      case "PENDING_PROVIDER_INVOICE": return { label: t("ticket.pills.pendingInvoice"), pillClass: "pill-inprogress" };
      case "PENDING_PAYMENT":        return { label: t("ticket.pills.pendingPayment"),   pillClass: "pill-inprogress" };
      case "COMPLETED":              return { label: t("ticket.pills.completed"),        pillClass: "pill-resolved" };
      case "DECLINED":               return { label: t("ticket.pills.declined"),         pillClass: "pill-closed" };
      case "CANCELLED":              return { label: t("ticket.pills.cancelled"),        pillClass: "pill-closed" };
      default:                       return { label: status, pillClass: "pill-pending" };
    }
  }

  if (isLoading) {
    return <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>{t("ticket.loadingTicket")}</div>;
  }
  if (isError || !ticket) {
    return (
      <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)" }}>
        {t("ticket.ticketNotFound")}{" "}
        <Link to="/dashboard/user" style={{ color: "var(--navy-700)", fontWeight: 600 }}>{t("ticket.backToDashboard")}</Link>
      </div>
    );
  }

  const ticketIdStr = `FIX-${String(ticket.id).padStart(4, "0")}`;
  const pill        = statusPill(ticket.status);
  const isProvider  = role === "PROVIDER";
  const isTerminal  = ticket.status === "DECLINED" || ticket.status === "CANCELLED";

  function headlineText(tk: Ticket, isP: boolean): { main: string; highlight: string | null } {
    const name = tk.assignedServiceProviderName;
    switch (tk.status) {
      case "PENDING_APPROVAL":
        return isP
          ? { main: t("ticketHeadline.pendingApproval_provider"), highlight: null }
          : { main: t("ticketHeadline.pendingApproval_customer"), highlight: null };
      case "APPROVED":
        return isP
          ? { main: t("ticketHeadline.approved_provider_main"), highlight: t("ticketHeadline.approved_provider_highlight") }
          : { main: name ? t("ticketHeadline.approved_customer_main", { name }) : t("ticketHeadline.approved_customer_main_generic"), highlight: t("ticketHeadline.approved_highlight") };
      case "IN_TRANSIT":
        return isP
          ? { main: t("ticketHeadline.inTransit_provider_main"), highlight: t("ticketHeadline.inTransit_provider_highlight") }
          : { main: name ? t("ticketHeadline.inTransit_customer_main", { name }) : t("ticketHeadline.inTransit_customer_generic"), highlight: null };
      case "PENDING_PROVIDER_INVOICE":
        return { main: t("ticketHeadline.pendingInvoice_main"), highlight: t("ticketHeadline.pendingInvoice_highlight") };
      case "PENDING_PAYMENT":
        return { main: t("ticketHeadline.pendingPayment_main"), highlight: t("ticketHeadline.pendingPayment_highlight") };
      case "COMPLETED":
        return { main: t("ticketHeadline.completed"), highlight: null };
      case "DECLINED":
        return { main: t("ticketHeadline.declined"), highlight: null };
      case "CANCELLED":
        return { main: t("ticketHeadline.cancelled"), highlight: null };
      default:
        return { main: tk.serviceType, highlight: null };
    }
  }

  const headline = headlineText(ticket, isProvider);

  const locale = i18n.language;

  function buildLog(tk: Ticket): LogEntry[] {
    const history: StatusHistoryEntry[] = tk.statusHistory ?? [];
    if (history.length > 0) {
      return [...history].reverse().map((entry) => ({
        time: fmt(entry.changedAt, locale), date: fmtDate(entry.changedAt, locale),
        text: (
          <>
            <b style={{ textTransform: "capitalize" }}>{entry.status.replace(/_/g, " ").toLowerCase()}</b>
            {" — "}
            {activityLabels[entry.status] ?? entry.status}
          </>
        ),
      }));
    }
    return [{
      time: fmt(tk.createdAt, locale), date: fmtDate(tk.createdAt, locale),
      text: (<><b>{tk.submittedByName ?? t("chat.you")}</b> {t("ticket.activityFiled")} <b>FIX-{String(tk.id).padStart(4, "0")}</b> — {tk.serviceType}.</>),
    }];
  }

  const activityEntries = buildLog(ticket);
  const NEXT_STATUS: Partial<Record<TicketStatus, { status: TicketStatus; label: string }>> = {
    APPROVED:   { status: "IN_TRANSIT",               label: t("ticket.actions.markInTransit") },
    IN_TRANSIT: { status: "PENDING_PROVIDER_INVOICE", label: t("ticket.actions.markWorkComplete") },
  };
  const nextStatus = isProvider ? NEXT_STATUS[ticket.status] : undefined;

  const metaLabels = {
    provider: t("ticket.provider"), location: t("ticket.location"),
    submittedBy: t("ticket.submittedBy"), quoted: t("ticket.quoted"),
    unassigned: t("ticket.unassigned"), estimatedCost: t("ticket.estimatedCost"),
    notYetQuoted: t("ticket.notYetQuoted"),
  };

  return (
    <>
      <style>{`
        @keyframes livesweep { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        @keyframes livepulse2 { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(2.2); opacity: 0; } }
      `}</style>

      <section className="ticket-live-header" style={{ background: "var(--navy-900)", backgroundImage: "radial-gradient(ellipse at 90% 0%, rgba(245,158,11,0.2), transparent 55%)", color: "#fff", padding: "28px 0 36px", position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)", backgroundSize: "56px 56px", pointerEvents: "none" }} />

        <div className="container" style={{ position: "relative" }}>
          <div className="row" style={{ marginBottom: 6, gap: 16, flexWrap: "wrap" }}>
            <Link to="/dashboard/user" className="mono" style={{ color: "rgba(255,255,255,0.6)", fontSize: 11.5, letterSpacing: "0.05em", textTransform: "uppercase", display: "inline-flex", alignItems: "center", gap: 6 }}>
              {t("ticket.dashboard")}
            </Link>
            <span className="mono" style={{ color: "rgba(255,255,255,0.4)", fontSize: 11.5 }}>/</span>
            <span className="mono" style={{ color: "rgba(255,255,255,0.85)", fontSize: 11.5, letterSpacing: "0.06em", textTransform: "uppercase" }}>{ticketIdStr}</span>
            <span className="grow" />
            {!isTerminal && (
              <span className="mono" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 11, color: "var(--amber-500)", letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                <span style={{ position: "relative", width: 8, height: 8, borderRadius: 4, background: "var(--amber-500)", display: "inline-block" }}>
                  <span style={{ position: "absolute", inset: -4, borderRadius: 8, background: "var(--amber-500)", opacity: 0.4, animation: "livepulse2 1.6s ease-out infinite" }} />
                </span>
                {t("ticket.live")}
              </span>
            )}
          </div>

          <div className="row" style={{ gap: 14, alignItems: "baseline", flexWrap: "wrap", marginTop: 4 }}>
            <span className={priorityBadgeClass(ticket.priority)} style={{ height: 24, fontSize: 11, padding: "4px 9px" }}>{t(priorityKey(ticket.priority))}</span>
            <span className={`pill ${pill.pillClass}`} style={{ fontSize: 12 }}><span className="dot" />{pill.label}</span>
            <span className="mono" style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, letterSpacing: "0.05em", textTransform: "uppercase" }}>
              {ticket.category.replace(/_/g, " ")}{ticket.location ? ` · ${ticket.location}` : ""}
            </span>
          </div>

          <h1 style={{ fontSize: "clamp(28px, 3vw, 40px)", fontWeight: 700, letterSpacing: "-0.025em", lineHeight: 1.1, margin: "14px 0 0", color: "#fff", maxWidth: 920 }}>
            {headline.main}{" "}
            {headline.highlight && <span style={{ color: "var(--amber-500)" }}>{headline.highlight}</span>}
          </h1>

          {!isTerminal && <PhaseRail ticketStatus={ticket.status} labels={stepLabels} />}

          {isTerminal && (
            <div style={{ marginTop: 20 }}>
              <span className="pill" style={{ background: ticket.status === "DECLINED" ? "rgba(185,28,28,0.25)" : "rgba(100,116,139,0.25)", color: ticket.status === "DECLINED" ? "#FCA5A5" : "rgba(255,255,255,0.6)", fontSize: 13, padding: "6px 14px" }}>
                <span className="dot" style={{ background: ticket.status === "DECLINED" ? "#FCA5A5" : "rgba(255,255,255,0.4)" }} />
                {ticket.status === "DECLINED" ? t("ticket.ticketDeclined") : t("ticket.ticketCancelled")}
              </span>
            </div>
          )}
        </div>
      </section>

      <main className="container ticket-detail-body" style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, padding: "24px 32px 64px", maxWidth: 1280, margin: "0 auto" }}>
        <div>
          <MetaCard ticket={ticket} labels={metaLabels} />

          {/* Live GPS tracking — only renders while the ticket is IN_TRANSIT */}
          {ticket.status === "IN_TRANSIT" && (
            <div style={{ marginBottom: 32 }}>
              <LiveTrackingPanel ticket={ticket} isProvider={isProvider} />
            </div>
          )}

          {/* Description */}
          <div className="panel-title">
            <span className="num">01</span>
            <span className="label">{t("ticket.whatsBroken")}</span>
            <span className="rule" />
          </div>
          <div className="card card-pad" style={{ marginBottom: 32 }}>
            <p style={{ fontSize: 16, lineHeight: 1.6, margin: 0, color: "var(--text)" }}>
              {ticket.description || t("ticket.noDescription")}
            </p>
            {(ticket.requestedStartAt || ticket.requestedEndAt) && (
              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)", display: "flex", gap: 24, flexWrap: "wrap" }}>
                {ticket.requestedStartAt && (
                  <div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{t("ticket.requestedStart")}</div>
                    <div className="mono" style={{ fontSize: 14 }}>{fmtDate(ticket.requestedStartAt, locale)} · {fmt(ticket.requestedStartAt, locale)}</div>
                  </div>
                )}
                {ticket.requestedEndAt && (
                  <div>
                    <div className="mono" style={{ fontSize: 10.5, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 4 }}>{t("ticket.requestedEnd")}</div>
                    <div className="mono" style={{ fontSize: 14 }}>{fmtDate(ticket.requestedEndAt, locale)} · {fmt(ticket.requestedEndAt, locale)}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {ticket.imageUrls && ticket.imageUrls.length > 0 && (
            <>
              <div className="panel-title">
                <span className="num">02</span>
                <span className="label">{t("ticket.photos")}</span>
                <span className="rule" />
                <span className="mono muted" style={{ fontSize: 11 }}>{t("ticket.attached", { count: ticket.imageUrls.length })}</span>
              </div>
              <div className="card card-pad" style={{ marginBottom: 32 }}>
                <ImageGallery urls={ticket.imageUrls} />
              </div>
            </>
          )}

          <div className="panel-title">
            <span className="num">{ticket.imageUrls && ticket.imageUrls.length > 0 ? "03" : "02"}</span>
            <span className="label">{t("ticket.activity")}</span>
            <span className="rule" />
            <span className="mono muted" style={{ fontSize: 11 }}>{t("ticket.events", { count: activityEntries.length })}</span>
          </div>
          <ActivityLog entries={activityEntries} />

          {isProvider && ticket.status === "PENDING_PROVIDER_INVOICE" && (
            <div style={{ marginTop: 28 }}><IssueInvoicePanel ticket={ticket} /></div>
          )}

          {(ticket.status === "PENDING_PAYMENT" || ticket.status === "COMPLETED") && ticket.estimatedCost != null && (
            <div style={{ marginTop: 16 }}>
              <button className="btn btn-secondary" onClick={async () => {
                const blob = await generateInvoicePdf({
                  ticketCode: `FIX-${String(ticket.id).padStart(4, "0")}`, serviceType: ticket.serviceType,
                  category: ticket.category, description: ticket.description, location: ticket.location ?? "",
                  providerName: ticket.assignedServiceProviderName ?? "Provider",
                  customerName: ticket.submittedByName ?? "Customer", amount: ticket.estimatedCost ?? 0,
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url; a.download = `Invoice-FIX-${String(ticket.id).padStart(4, "0")}.pdf`; a.click();
                setTimeout(() => URL.revokeObjectURL(url), 60_000);
              }}>
                {t("ticket.downloadInvoice")}
              </button>
            </div>
          )}

          {acceptError && (
            <div style={{ marginTop: 16, padding: "10px 14px", borderRadius: 8, background: "var(--red-50, #fef2f2)", border: "1px solid var(--red-200, #fecaca)", color: "var(--red-700, #b91c1c)", fontSize: 13 }}>
              {acceptError.toLowerCase().includes("payout") ? (
                <>{t("ticket.acceptPayoutError")}{" "}<Link to="/profile/edit" style={{ color: "inherit", fontWeight: 600 }}>{t("ticket.acceptPayoutErrorLink")}</Link></>
              ) : acceptError}
            </div>
          )}

          <div className="row" style={{ marginTop: 28, gap: 12, flexWrap: "wrap" }}>
            <button className="btn btn-secondary" onClick={() => navigate(isProvider ? "/dashboard/provider" : "/dashboard/user")}>
              {t("ticket.backToDashboardBtn")}
            </button>
            <span className="grow" />
            {isProvider && ticket.status === "PENDING_APPROVAL" && (() => {
              const isUnassigned = !ticket.assignedServiceProviderId;
              const anyPending = acceptMut.isPending || confirmMut.isPending || declineMut.isPending;
              const refreshTicket = () => queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });

              const handleAccept = () => {
                setAcceptError(null);
                const onError = (err: unknown) => setAcceptError(getErrorMessage(err));
                if (isUnassigned) { acceptMut.mutate(ticket.id, { onSuccess: refreshTicket, onError }); }
                else if (ticket.requestedStartAt) { confirmMut.mutate(ticket.id, { onSuccess: refreshTicket, onError }); }
                else { updateMut.mutate({ ticketId: ticket.id, status: "APPROVED" }, { onError }); }
              };

              const acceptLabel = isUnassigned ? t("ticket.actions.acceptAssign") : ticket.requestedStartAt ? t("ticket.actions.confirmSchedule") : t("ticket.actions.accept");

              return (
                <>
                  {!isUnassigned && (
                    <button className="btn btn-secondary" disabled={anyPending} onClick={() => declineMut.mutate(ticket.id, { onSuccess: () => { refreshTicket(); navigate("/dashboard/provider"); } })}>
                      {declineMut.isPending ? t("ticket.declining") : t("ticket.decline")}
                    </button>
                  )}
                  <button className="btn btn-primary" disabled={anyPending} onClick={handleAccept}>
                    {anyPending ? t("ticket.updating") : acceptLabel}
                  </button>
                </>
              );
            })()}
            {nextStatus && (
              <button className="btn btn-primary" disabled={updateMut.isPending} onClick={() => updateMut.mutate({ ticketId: ticket.id, status: nextStatus.status })}>
                {updateMut.isPending ? t("ticket.updating") : nextStatus.label}
              </button>
            )}
            {role !== "PROVIDER" && ticket.status === "PENDING_APPROVAL" && (
              <button className="btn btn-danger" disabled={cancelMut.isPending} onClick={() => setCancelDialogOpen(true)}>
                {t("ticket.cancelTicket")}
              </button>
            )}
          </div>
        </div>

        <aside>
          <TicketChatPanel ticket={ticket} />
        </aside>
      </main>

      <ConfirmDialog
        open={cancelDialogOpen}
        title={t("ticket.cancelDialog.title")}
        confirmLabel={t("ticket.cancelDialog.confirm")}
        loadingLabel={t("ticket.cancelDialog.loading")}
        cancelLabel={t("ticket.cancelDialog.keep")}
        loading={cancelMut.isPending}
        onCancel={() => setCancelDialogOpen(false)}
        onConfirm={() =>
          cancelMut.mutate(ticket.id, {
            onSuccess: () => {
              setCancelDialogOpen(false);
              notify(t("ticket.ticketCancelled"), "success");
            },
            onError: (err) => {
              notify(getErrorMessage(err) || t("ticket.cancelDialog.error"), "error");
            },
          })
        }
      >
        {t("ticket.cancelDialog.body", { code: ticketIdStr })}
      </ConfirmDialog>
    </>
  );
}
