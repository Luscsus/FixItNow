import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import { useConfirmTicketMutation, useDeclineTicketMutation } from "@/hooks/useConfirmTicketMutation";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import type { Ticket } from "@/domain/ticket";

const PAGE_SIZE = 6;

const PRIORITY_CLASS: Record<string, string> = {
  CRITICAL: "urgency-critical",
  HIGH: "urgency-high",
  MEDIUM: "urgency-medium",
  LOW: "urgency-low",
};

function pad(n: number) { return String(n).padStart(2, "0"); }

function fmtTime(d: Date) {
  return d.getMinutes() === 0 ? `${d.getHours()}:00` : `${d.getHours()}:${pad(d.getMinutes())}`;
}

function fmtAge(d: Date, locale: string): string {
  const mins = Math.floor((Date.now() - d.getTime()) / 60000);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });
  if (mins < 60) return rtf.format(-mins, "minute");
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return rtf.format(-hrs, "hour");
  return rtf.format(-Math.floor(hrs / 24), "day");
}

function RequestedTimeChip({ startAt, endAt, locale }: { readonly startAt: Date; readonly endAt: Date | null | undefined; readonly locale: string }) {
  const s = startAt;
  const timeRange = endAt
    ? `${fmtTime(s)}–${fmtTime(endAt)}`
    : fmtTime(s);
  const datePart = s.toLocaleDateString(locale, { weekday: "short", month: "short", day: "numeric" });
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
      🕐 {datePart} · {timeRange}
    </span>
  );
}

function InboundRow({ ticket }: { readonly ticket: Ticket }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const confirmMut = useConfirmTicketMutation();
  const declineMut = useDeclineTicketMutation();
  const busy = confirmMut.isPending || declineMut.isPending;

  const priorityLabel: Record<string, string> = {
    CRITICAL: t("providerAccount.inbound_priority_critical"),
    HIGH: t("providerAccount.inbound_priority_high"),
    MEDIUM: t("providerAccount.inbound_priority_medium"),
    LOW: t("providerAccount.inbound_priority_low"),
  };

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
            {(ticket.priority && priorityLabel[ticket.priority]) ?? t("providerAccount.inbound_priority_medium")}
          </span>
          <span>•</span>
          <span>{ticket.location}</span>
          <span>•</span>
          <span className="mono">{fmtAge(ticket.createdAt, i18n.language)}</span>
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
                locale={i18n.language}
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
          {t("providerAccount.inbound_decline")}
        </button>
        <button
          className="btn btn-primary btn-sm"
          disabled={busy}
          onClick={(e) => { e.stopPropagation(); confirmMut.mutate(ticket.id); }}
        >
          {confirmMut.isPending
            ? t("providerAccount.inbound_confirming")
            : ticket.requestedStartAt
              ? t("providerAccount.inbound_confirmSchedule")
              : t("providerAccount.inbound_accept")}
        </button>
      </div>
    </div>
  );
}

export function InboundRequests() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useProviderTicketsQuery();
  const [page, setPage] = useState(1);

  const pending = tickets.filter((tk) => tk.status === "PENDING_APPROVAL");
  const { pageItems, totalPages, safePage } = usePaginatedItems(pending, page, PAGE_SIZE);

  return (
    <>
      <div className="panel-title">
        <span className="num">02</span>
        <span className="label">{t("providerAccount.inbound_title")}</span>
        <span className="rule" />
        {!isLoading && (
          <span className="mono muted" style={{ fontSize: 11 }}>
            {t("providerAccount.inbound_waiting", { count: pending.length })}
          </span>
        )}
      </div>

      <div className="card" style={{ marginBottom: 32, padding: 0 }}>
        {isLoading && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            {t("providerAccount.inbound_loading")}
          </div>
        )}
        {!isLoading && pending.length === 0 && (
          <div style={{ padding: "20px 24px", fontSize: 13, color: "var(--text-muted)" }}>
            {t("providerAccount.inbound_empty")}
          </div>
        )}
        {pageItems.map((tk) => (
          <InboundRow key={tk.id} ticket={tk} />
        ))}
      </div>
      <Pagination page={safePage} total={totalPages} onChange={setPage} />
    </>
  );
}
