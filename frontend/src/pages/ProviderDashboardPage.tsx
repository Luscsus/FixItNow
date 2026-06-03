import { useTranslation } from "react-i18next";
import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";
import { useAcceptTicketMutation } from "@/hooks/useAcceptTicketMutation";
import {
  useConfirmTicketMutation,
  useDeclineTicketMutation,
} from "@/hooks/useConfirmTicketMutation";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { useOpenTicketsQuery } from "@/hooks/useOpenTicketsQuery";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useUpdateTicketStatusMutation } from "@/hooks/useUpdateTicketStatusMutation";
import { useNavigate } from "react-router-dom";
import { useState, useMemo } from "react";
import { useToast } from "@/components/ui/toast";
import { getErrorMessage } from "@/lib/errorMessage";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import { IconSearch } from "@/components/browse/BrowseIcons";

const PAGE_SIZE = 6;

const ACTIVE_STATUSES: TicketStatus[] = [
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
];

const PRIORITY_RANK: Record<string, number> = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
type OpenSort = "newest" | "oldest" | "priority" | "budget";

function priorityClass(p: TicketPriority | null): string {
  return p === "CRITICAL"
    ? "critical"
    : p === "HIGH"
      ? "high"
      : p === "MEDIUM"
        ? "medium"
        : "low";
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

function pad(n: number) {
  return String(n).padStart(2, "0");
}
function fmtTime(d: Date) {
  return d.getMinutes() === 0
    ? `${d.getHours()}:00`
    : `${d.getHours()}:${pad(d.getMinutes())}`;
}
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const WDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function RequestedTimeChip({
  startAt,
  endAt,
}: {
  startAt: Date;
  endAt: Date | null | undefined;
}) {
  const timeRange = endAt
    ? `${fmtTime(startAt)}–${fmtTime(endAt)}`
    : fmtTime(startAt);
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
      🕐 {WDAYS[startAt.getDay()]} {MONTHS[startAt.getMonth()]}{" "}
      {startAt.getDate()} · {timeRange}
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
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pc = priorityClass(ticket.priority);
  return (
    <div
      className={`req-card u-${pc}`}
      style={{ cursor: "pointer" }}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="req-rail" />
      <div className="req-card-inner">
        <div className="req-head">
          <span className="rid">{formatId(ticket.id)}</span>
          <span className="rcat">· {ticket.serviceType}</span>
          <span className="grow" />
          <span className={`urgency urgency-${pc}`}>
            {ticket.priority
              ? ticket.priority.charAt(0) +
                ticket.priority.slice(1).toLowerCase()
              : "—"}
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
              <RequestedTimeChip
                startAt={ticket.requestedStartAt}
                endAt={ticket.requestedEndAt}
              />
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
            <div className="req-cust-name">
              {ticket.submittedByName ?? "Unknown user"}
            </div>
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
              onClick={(e) => {
                e.stopPropagation();
                onDecline();
              }}
              disabled={isPending}
            >
              {t("ticket.decline")}
            </button>
          )}
          <button
            className="btn btn-primary btn-sm"
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAccept();
            }}
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
  const { t } = useTranslation();
  const navigate = useNavigate();

  const statusLabel: Record<TicketStatus, string> = {
    APPROVED:               t("ticket.pills.accepted"),
    IN_TRANSIT:             t("ticket.pills.onSite"),
    PENDING_PROVIDER_INVOICE: t("ticket.pills.pendingInvoice"),
    PENDING_PAYMENT:        t("ticket.pills.pendingPayment"),
    PENDING_APPROVAL:       t("ticket.pills.awaitingProvider"),
    DECLINED:               t("ticket.pills.declined"),
    COMPLETED:              t("ticket.pills.completed"),
    CANCELLED:              t("ticket.pills.cancelled"),
  };

  return (
    <div
      className={`job-card in-progress`}
      onClick={() => navigate(`/tickets/${ticket.id}`)}
    >
      <div className="job-rail" />
      <div className="job-body">
        <div className="job-head">
          <span
            className="mono muted"
            style={{ fontSize: 11, letterSpacing: "0.06em" }}
          >
            {formatId(ticket.id)}
          </span>
          <span
            className="mono muted"
            style={{
              fontSize: 11,
              letterSpacing: "0.06em",
              textTransform: "uppercase",
            }}
          >
            · {ticket.serviceType}
          </span>
          <span className="grow" />
          <span className={`pill pill-inprogress`}>
            <span className="dot" />{" "}
            {statusLabel[ticket.status] ?? ticket.status}
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
  const { t } = useTranslation();
  const { data: provider } = useCurrentProvider();
  const { data: providerTickets = [], isLoading: loadingProvider } =
    useProviderTicketsQuery();
  const { data: openTickets = [], isLoading: loadingOpen } =
    useOpenTicketsQuery();
  const { notify } = useToast();

  const updateStatus = useUpdateTicketStatusMutation();
  const confirmMut = useConfirmTicketMutation();
  const declineMut = useDeclineTicketMutation();
  const acceptOpen = useAcceptTicketMutation();

  const handleAcceptError = (err: unknown) => {
    const msg = getErrorMessage(err);
    notify(msg || "Could not accept this ticket.", "error");
  };

  const inboundTickets = providerTickets.filter(
    (t) => t.status === "PENDING_APPROVAL",
  );
  const activeJobs = providerTickets.filter((t) =>
    (ACTIVE_STATUSES as string[]).includes(t.status),
  );

  const [inboundPage, setInboundPage] = useState(1);
  const [activePage, setActivePage] = useState(1);
  const [openPage, setOpenPage] = useState(1);

  // ── Open-jobs board: filters + sort (client-side over the fetched open list) ──
  const [openSearch, setOpenSearch] = useState("");
  const [openCategory, setOpenCategory] = useState<string>("");
  const [openPriority, setOpenPriority] = useState<string>("");
  const [openSort, setOpenSort] = useState<OpenSort>("newest");
  const resetOpenPage = () => setOpenPage(1);

  // Categories actually present in the open list, for the dropdown.
  const openCategories = useMemo(
    () => Array.from(new Set(openTickets.map((tk) => tk.category))).sort(),
    [openTickets],
  );

  const filteredOpen = useMemo(() => {
    let list = openTickets;
    const q = openSearch.trim().toLowerCase();
    if (q) {
      list = list.filter((tk) =>
        (tk.serviceType ?? "").toLowerCase().includes(q) ||
        (tk.description ?? "").toLowerCase().includes(q) ||
        (tk.location ?? "").toLowerCase().includes(q),
      );
    }
    if (openCategory) list = list.filter((tk) => tk.category === openCategory);
    if (openPriority) list = list.filter((tk) => tk.priority === openPriority);

    const sorted = [...list];
    switch (openSort) {
      case "newest":   sorted.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()); break;
      case "oldest":   sorted.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()); break;
      case "priority": sorted.sort((a, b) => (PRIORITY_RANK[b.priority ?? "LOW"] ?? 0) - (PRIORITY_RANK[a.priority ?? "LOW"] ?? 0)); break;
      case "budget":   sorted.sort((a, b) => (b.estimatedCost ?? 0) - (a.estimatedCost ?? 0)); break;
    }
    return sorted;
  }, [openTickets, openSearch, openCategory, openPriority, openSort]);

  const openFiltersActive = Boolean(openSearch || openCategory || openPriority);

  const inboundPaged = usePaginatedItems(inboundTickets, inboundPage, PAGE_SIZE);
  const activePaged = usePaginatedItems(activeJobs, activePage, PAGE_SIZE);
  const openPaged = usePaginatedItems(filteredOpen, openPage, PAGE_SIZE);

  const providerName = provider
    ? [provider.firstName, provider.lastName].filter(Boolean).join(" ") ||
      provider.email
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
                {t("dashboard.providerDashboard")} · {providerName}
              </span>
              <h1 className="dash-hero-headline">
                {inboundTickets.length > 0 ? (
                  <>
                    {t("dashboard.gotInbound", { count: inboundTickets.length })}
                    {activeJobs.length > 0 && (
                      <>{t("dashboard.andActiveJobs", { count: activeJobs.length })}</>
                    )}
                  </>
                ) : activeJobs.length > 0 ? (
                  t("dashboard.activeJobsInProgress", { count: activeJobs.length })
                ) : (
                  <>{t("dashboard.welcomeBackProvider")}, <b>{firstName}</b>. {t("dashboard.noRequestsNow")}</>
                )}
              </h1>
            </div>

            <div className="status-pod">
              <span className="status-pulse" />
              <div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "#34D399", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 700 }}>
                  {t("dashboard.onlineAccepting")}
                </div>
                <div style={{ color: "#fff", fontSize: 13.5, fontWeight: 500, marginTop: 2, letterSpacing: "-0.01em" }}>
                  {t("dashboard.openTicketsAvailable", { count: openTickets.length })}
                </div>
              </div>
            </div>
          </div>

          <div
            className="hero-stats"
            style={{ gridTemplateColumns: "repeat(3, 1fr)" }}
          >
            <div className="hstat warn">
              <div className="hstat-label">{t("dashboard.requestsWaiting")}</div>
              <div className="hstat-num">{String(inboundTickets.length).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.assignedPending")}</div>
            </div>
            <div className="hstat">
              <div className="hstat-label">{t("dashboard.activeJobs")}</div>
              <div className="hstat-num">{String(activeJobs.length).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.inProgress")}</div>
            </div>
            <div className="hstat accent">
              <div className="hstat-label">{t("dashboard.openToAnyone")}</div>
              <div className="hstat-num">{String(openTickets.length).padStart(2, "0")}</div>
              <div className="hstat-hint">{t("dashboard.noProviderAssigned")}</div>
            </div>
          </div>
        </div>
      </section>

      <main className="container page-area">
        {/* ── Panel 01: Inbound requests ── */}
        <div className="panel-title">
          <span className="num">01</span>
          <span className="label">{t("dashboard.inboundRequests")}</span>
          <span className="rule" />
          <span className="mono" style={{ fontSize: 11, color: "var(--amber-700)", background: "var(--amber-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
            {inboundTickets.length} {t("dashboard.waiting")}
          </span>
        </div>

        {loadingProvider ? (
          <div style={{ padding: "32px 0", color: "var(--slate-400)" }}>{t("common.loading")}</div>
        ) : inboundTickets.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 48 }}>
            <div style={{ fontSize: 15, color: "var(--slate-500)" }}>{t("dashboard.noInbound")}</div>
          </div>
        ) : (
          <>
            <div className="dash-card-grid">
              {inboundPaged.pageItems.map((ticket) => (
                <RequestCard
                  key={ticket.id}
                  ticket={ticket}
                  acceptLabel={ticket.requestedStartAt ? t("ticket.actions.confirmSchedule") : t("ticket.actions.accept")}
                  isPending={confirmMut.isPending || declineMut.isPending || updateStatus.isPending}
                  onAccept={() => ticket.requestedStartAt
                    ? confirmMut.mutate(ticket.id, { onError: handleAcceptError })
                    : updateStatus.mutate(
                        { ticketId: ticket.id, status: "APPROVED" },
                        { onError: handleAcceptError },
                      )}
                  onDecline={() => declineMut.mutate(ticket.id)}
                />
              ))}
            </div>
            <Pagination
              page={inboundPaged.safePage}
              total={inboundPaged.totalPages}
              onChange={setInboundPage}
            />
          </>
        )}

        {/* ── Panel 02: Active jobs ── */}
        {activeJobs.length > 0 && (
          <>
            <div className="panel-title">
              <span className="num">02</span>
              <span className="label">{t("dashboard.jobsInProgress")}</span>
              <span className="rule" />
              <span className="mono muted" style={{ fontSize: 11 }}>{activeJobs.length} {t("dashboard.inProgress_badge")}</span>
            </div>
            <div className="dash-card-grid">
              {activePaged.pageItems.map((ticket) => (
                <ActiveJobCard key={ticket.id} ticket={ticket} />
              ))}
            </div>
            <Pagination
              page={activePaged.safePage}
              total={activePaged.totalPages}
              onChange={setActivePage}
            />
          </>
        )}

        {/* ── Panel 03: Open to anyone ── */}
        <div className="panel-title">
          <span className="num">{activeJobs.length > 0 ? "03" : "02"}</span>
          <span className="label">{t("dashboard.nearbyOpenTickets")}</span>
          <span className="rule" />
          <span className="mono" style={{ fontSize: 11, color: "var(--blue-700)", background: "var(--blue-50)", padding: "3px 8px", borderRadius: 4, letterSpacing: "0.05em" }}>
            {openTickets.length} {t("dashboard.available_badge")}
          </span>
        </div>

        {loadingOpen ? (
          <div style={{ padding: "32px 0", color: "var(--slate-400)" }}>{t("common.loading")}</div>
        ) : openTickets.length === 0 ? (
          <div className="card card-pad" style={{ textAlign: "center", padding: "40px 24px", marginBottom: 48 }}>
            <div style={{ fontSize: 15, color: "var(--slate-500)" }}>{t("dashboard.noNearby")}</div>
          </div>
        ) : (
          <>
            {/* Filter + sort bar */}
            <div
              style={{
                display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center",
                marginBottom: 18, padding: 10,
                background: "var(--slate-50, #f8fafc)",
                border: "1px solid var(--border)", borderRadius: 12,
              }}
            >
              {/* Search */}
              <div style={{ position: "relative", flex: "1 1 220px", minWidth: 160 }}>
                <span style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: openSearch ? "var(--text)" : "var(--text-muted)", display: "inline-flex", pointerEvents: "none" }}>
                  <IconSearch size={16} />
                </span>
                <input
                  type="text"
                  value={openSearch}
                  onChange={(e) => { setOpenSearch(e.target.value); resetOpenPage(); }}
                  placeholder={t("dashboard.openFilter_searchPlaceholder")}
                  aria-label={t("dashboard.openFilter_searchPlaceholder")}
                  style={{ width: "100%", boxSizing: "border-box", height: 40, padding: "0 12px 0 36px", borderRadius: 9, border: "1px solid var(--border)", background: "#fff", fontSize: 14, color: "var(--text)", fontFamily: "inherit", outline: "none" }}
                />
              </div>

              {/* Category */}
              <select
                value={openCategory}
                onChange={(e) => { setOpenCategory(e.target.value); resetOpenPage(); }}
                aria-label={t("dashboard.openFilter_category")}
                className="fselect"
                style={{ width: "auto", flex: "0 1 168px", minWidth: 140, height: 40, minHeight: 0, padding: "0 32px 0 12px", fontSize: 14, borderWidth: 1 }}
              >
                <option value="">{t("dashboard.openFilter_allCategories")}</option>
                {openCategories.map((c) => (
                  <option key={c} value={c}>{t(`categories.${c}`, { defaultValue: c })}</option>
                ))}
              </select>

              {/* Priority */}
              <select
                value={openPriority}
                onChange={(e) => { setOpenPriority(e.target.value); resetOpenPage(); }}
                aria-label={t("dashboard.openFilter_priority")}
                className="fselect"
                style={{ width: "auto", flex: "0 1 156px", minWidth: 132, height: 40, minHeight: 0, padding: "0 32px 0 12px", fontSize: 14, borderWidth: 1 }}
              >
                <option value="">{t("dashboard.openFilter_allPriorities")}</option>
                <option value="CRITICAL">{t("dashboard.priority_critical")}</option>
                <option value="HIGH">{t("dashboard.priority_high")}</option>
                <option value="MEDIUM">{t("dashboard.priority_medium")}</option>
                <option value="LOW">{t("dashboard.priority_low")}</option>
              </select>

              {/* Divider before sort */}
              <span style={{ width: 1, alignSelf: "stretch", background: "var(--border)", margin: "2px 0" }} aria-hidden="true" />

              {/* Sort */}
              <select
                value={openSort}
                onChange={(e) => { setOpenSort(e.target.value as OpenSort); resetOpenPage(); }}
                aria-label={t("dashboard.openFilter_sort")}
                className="fselect"
                style={{ width: "auto", flex: "0 1 176px", minWidth: 150, height: 40, minHeight: 0, padding: "0 32px 0 12px", fontSize: 14, borderWidth: 1 }}
              >
                <option value="newest">{t("dashboard.openSort_newest")}</option>
                <option value="oldest">{t("dashboard.openSort_oldest")}</option>
                <option value="priority">{t("dashboard.openSort_priority")}</option>
                <option value="budget">{t("dashboard.openSort_budget")}</option>
              </select>

              {openFiltersActive && (
                <button
                  type="button"
                  onClick={() => { setOpenSearch(""); setOpenCategory(""); setOpenPriority(""); resetOpenPage(); }}
                  style={{ height: 40, padding: "0 14px", borderRadius: 9, border: "1px solid var(--border)", background: "#fff", color: "var(--text-muted)", fontSize: 13.5, fontWeight: 500, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}
                >
                  {t("dashboard.openFilter_clear")}
                </button>
              )}
            </div>

            {filteredOpen.length === 0 ? (
              <div className="card card-pad" style={{ textAlign: "center", padding: "32px 24px", marginBottom: 48 }}>
                <div style={{ fontSize: 14.5, color: "var(--slate-500)" }}>{t("dashboard.openFilter_noMatches")}</div>
              </div>
            ) : (
              <>
                <div className="dash-card-grid">
                  {openPaged.pageItems.map((ticket) => (
                    <RequestCard
                      key={ticket.id}
                      ticket={ticket}
                      acceptLabel={t("ticket.actions.acceptAssign")}
                      isPending={acceptOpen.isPending}
                      onAccept={() => {
                        acceptOpen.mutate(ticket.id, { onError: handleAcceptError });
                      }}
                    />
                  ))}
                </div>
                <Pagination page={openPaged.safePage} total={openPaged.totalPages} onChange={setOpenPage} />
              </>
            )}
          </>
        )}

        {/* ── Pro tip ── */}
        <div className="pulse-card" style={{ marginTop: 16, background: "var(--amber-50)", borderColor: "var(--amber-100)" }}>
          <span className="eyebrow-plain" style={{ color: "var(--amber-700)" }}>{t("dashboard.proTip_provider_eyebrow")}</span>
          <p style={{ fontSize: 14, lineHeight: 1.55, margin: "8px 0 0", color: "var(--amber-700)" }}>
            {t("dashboard.proTip_provider_text")}
          </p>
        </div>
      </main>
    </div>
  );
}
