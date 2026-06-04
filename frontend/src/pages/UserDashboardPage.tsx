import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useSEO } from "@/hooks/useSEO";

import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";
import { useTicketsQuery } from "@/hooks/useTicketsQuery";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";

type TicketFilter = "active" | "resolved" | "all";

const TERMINAL_STATUSES: TicketStatus[] = ["COMPLETED", "DECLINED", "CANCELLED"];
const TICKETS_PAGE_SIZE = 6;

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

function TicketCard({ ticket, onClick }: { ticket: Ticket; onClick?: () => void }) {
  const { t } = useTranslation();
  const isTerminal =
    ticket.status === "DECLINED" || ticket.status === "CANCELLED";
  const steps = statusToSteps(ticket.status);
  const ticketIdStr = `FIX-${String(ticket.id).padStart(4, "0")}`;

  return (
    <div className={`ticket ${priorityClass(ticket.priority)}`} style={{ cursor: "pointer" }} onClick={onClick}>
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
              {ticket.status === "DECLINED" ? t("ticket.pills.declined") : t("ticket.pills.cancelled")}
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
                    <div className="ticket-prov-role">{t("dashboard.serviceProvider")}</div>
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
                    <div className="ticket-prov-role">{t("dashboard.serviceProvider")}</div>
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
                  {t("dashboard.awaitingProvider")}
                </div>
                <div className="ticket-prov-role">{t("dashboard.pendingApprovalStatus")}</div>
              </div>
              <span className="grow" />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function UserDashboardPage() {
  useSEO({ title: "My Dashboard", robots: "noindex, nofollow" });
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useTicketsQuery();
  const [filter, setFilter] = useState<TicketFilter>("active");
  const navigate = useNavigate();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const openCount = tickets.filter((t) => t.status === "PENDING_APPROVAL").length;
  const inProgressCount = tickets.filter((t) =>
    (["APPROVED", "IN_TRANSIT", "PENDING_PROVIDER_INVOICE", "PENDING_PAYMENT"] as TicketStatus[]).includes(t.status)
  ).length;
  const resolvedCount = tickets.filter(
    (t) => t.status === "COMPLETED" && t.createdAt >= thirtyDaysAgo
  ).length;
  const highPriorityCount = tickets.filter(
    (t) =>
      (t.priority === "HIGH" || t.priority === "CRITICAL") &&
      !TERMINAL_STATUSES.includes(t.status)
  ).length;

  const filteredTickets = useMemo(() => {
    if (filter === "active") return tickets.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    if (filter === "resolved") return tickets.filter((t) => TERMINAL_STATUSES.includes(t.status));
    return tickets;
  }, [tickets, filter]);

  const [page, setPage] = useState(1);
  const { pageItems: pagedTickets, totalPages, safePage } = usePaginatedItems(filteredTickets, page, TICKETS_PAGE_SIZE);

  let panelLabel = t("dashboard.allTickets");
  if (filter === "active") panelLabel = t("dashboard.yourActiveTickets");
  else if (filter === "resolved") panelLabel = t("dashboard.resolvedTickets");

  let countLabel = t("dashboard.countTotal");
  if (filter === "active") countLabel = t("dashboard.countActive");
  else if (filter === "resolved") countLabel = t("dashboard.countResolved");

  let emptyMessage = t("dashboard.noTicketsYet");
  if (filter === "active") emptyMessage = t("dashboard.noActiveTickets");
  else if (filter === "resolved") emptyMessage = t("dashboard.noResolvedTickets");

  return (
    <div>
      {/* ── Hero band ── */}
      <section className="dash-hero">
        <div className="dash-hero-grid" />
        <div className="container dash-hero-inner">
          <span className="eyebrow" style={{ color: "var(--amber-500)" }}>
            {now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
          {openCount > 0 ? (
            <h1 className="dash-hero-headline">
              {t("dashboard.youveGot")}{" "}
              <span style={{ color: "var(--amber-500)" }}>
                {t("dashboard.openTicket", { count: openCount })}
              </span>
              .
            </h1>
          ) : (
            <h1 className="dash-hero-headline">
              {t("dashboard.noOpenTickets")}{" "}
              <Link to="/tickets/new" style={{ color: "var(--amber-500)" }}>
                {t("dashboard.fileOneNow")}
              </Link>
            </h1>
          )}
          <div className="hero-stats">
            <div className="hstat">
              <div className="hstat-label">{t("dashboard.openTickets")}</div>
              <div className="hstat-num">{String(openCount).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.pendingApproval")}</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">{t("dashboard.inProgress")}</div>
              <div className="hstat-num">{String(inProgressCount).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.activeJobsHint")}</div>
            </div>
            <div className="hstat accent">
              <div className="hstat-label">{t("dashboard.resolved30d")}</div>
              <div className="hstat-num">{String(resolvedCount).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.completedTickets")}</div>
            </div>
            <div className="hstat danger">
              <div className="hstat-label">{t("dashboard.highPriority")}</div>
              <div className="hstat-num">{String(highPriorityCount).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.highOrCritical")}</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container page" style={{ paddingTop: 32 }}>

        {/* ── Action row ── */}
        <div className="row" style={{ marginBottom: 24, gap: 12 }}>
          <div className="segment">
            <button aria-pressed={filter === "active"} onClick={() => { setFilter("active"); setPage(1); }}>{t("dashboard.active")}</button>
            <button aria-pressed={filter === "resolved"} onClick={() => { setFilter("resolved"); setPage(1); }}>{t("dashboard.resolved")}</button>
            <button aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>{t("dashboard.all")}</button>
          </div>
          <span className="grow" />
          <Link to="/tickets/new" className="btn btn-primary btn-sm">{t("dashboard.newTicket")}</Link>
        </div>

        {/* ── Panel 01: Tickets list ── */}
        <div className="panel-title">
          <span className="num">01</span>
          <span className="label">{panelLabel}</span>
          <span className="rule" />
          <span className="mono muted" style={{ fontSize: 11.5 }}>
            {String(filteredTickets.length).padStart(2, "0")} {countLabel}
          </span>
        </div>

        {isLoading ? (
          <div style={{ padding: "48px 0", textAlign: "center", color: "var(--slate-400)" }}>
            {t("dashboard.loadingTickets")}
          </div>
        ) : filteredTickets.length === 0 ? (
          <div
            className="card card-pad"
            style={{ textAlign: "center", padding: "48px 24px", marginBottom: 48 }}
          >
            <div style={{ fontSize: 15, color: "var(--slate-500)", marginBottom: 12 }}>
              {emptyMessage}
            </div>
            {filter !== "resolved" && (
              <Link to="/tickets/new" className="btn btn-primary btn-sm">
                {tickets.length === 0 ? t("dashboard.fileFirst2") : t("dashboard.fileNew")}
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="dash-card-grid">
              {pagedTickets.map((ticket) => (
                <TicketCard
                  key={ticket.id}
                  ticket={ticket}
                  onClick={() => navigate(`/tickets/${ticket.id}`)}
                />
              ))}
            </div>
            <Pagination page={safePage} total={totalPages} onChange={setPage} />
          </>
        )}

        {/* ── Panel 02: Find a provider ── */}
        <div style={{ maxWidth: 420 }}>
          <div className="panel-title">
            <span className="num">02</span>
            <span className="label">{t("dashboard.findProvider")}</span>
            <span className="rule" />
          </div>
          <div className="card card-pad" style={{ padding: 22 }}>
            <p className="muted" style={{ fontSize: 13.5, lineHeight: 1.55, margin: "0 0 16px" }}>
              {t("dashboard.findProviderDesc")}
            </p>
            <Link to="/tickets/new" className="btn btn-primary btn-full">{t("dashboard.fileNewTicket")}</Link>
          </div>

          <div className="card card-pad" style={{ marginTop: 16, padding: 22 }}>
            <span className="eyebrow-plain">{t("dashboard.proTip")}</span>
            <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0", color: "var(--text)" }}>
              {t("dashboard.proTipBody")}
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
