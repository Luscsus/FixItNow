import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useTicketsQuery } from "@/hooks/useTicketsQuery";
import type { TicketStatus } from "@/domain/ticket";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";

const TERMINAL_STATUSES = new Set<TicketStatus>(["COMPLETED", "DECLINED", "CANCELLED"]);
const PAGE_SIZE = 6;

type Filter = "active" | "resolved" | "all";

export function TicketsTab() {
  const { t } = useTranslation();
  const { data: tickets = [], isLoading } = useTicketsQuery();
  const [{ filter, page }, setFilterPage] = useState({ filter: "active" as Filter, page: 1 });
  const setFilter = (f: Filter) => setFilterPage({ filter: f, page: 1 });
  const setPage = (p: number) => setFilterPage((prev) => ({ ...prev, page: p }));

  const filtered = useMemo(() => {
    if (filter === "active") return tickets.filter((tk) => !TERMINAL_STATUSES.has(tk.status));
    if (filter === "resolved") return tickets.filter((tk) => TERMINAL_STATUSES.has(tk.status));
    return tickets;
  }, [tickets, filter]);

  const { pageItems, totalPages, safePage } = usePaginatedItems(filtered, page, PAGE_SIZE);

  function panelTitle(): string {
    if (filter === "active") return t("userAccount.tickets_activeTitle");
    if (filter === "resolved") return t("userAccount.tickets_resolvedTitle");
    return t("userAccount.tickets_allTitle");
  }

  function countLabel(): string {
    if (filter === "active") return t("userAccount.tickets_countActive");
    if (filter === "resolved") return t("userAccount.tickets_countResolved");
    return t("userAccount.tickets_countTotal");
  }

  function emptyMessage(): string {
    if (filter === "active") return t("userAccount.tickets_noActive");
    if (filter === "resolved") return t("userAccount.tickets_noResolved");
    return t("userAccount.tickets_noAny");
  }

  return (
    <>
      <div className="row" style={{ marginBottom: 20, gap: 12, alignItems: "center" }}>
        <div className="segment">
          <button aria-pressed={filter === "active"} onClick={() => { setFilter("active"); setPage(1); }}>{t("userAccount.tickets_active")}</button>
          <button aria-pressed={filter === "resolved"} onClick={() => { setFilter("resolved"); setPage(1); }}>{t("userAccount.tickets_resolved")}</button>
          <button aria-pressed={filter === "all"} onClick={() => { setFilter("all"); setPage(1); }}>{t("userAccount.tickets_all")}</button>
        </div>
        <span className="grow" />
        <Link to="/tickets/new" className="btn btn-primary btn-sm">{t("userAccount.tickets_newTicket")}</Link>
      </div>

      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">{panelTitle()}</span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>
          {String(filtered.length).padStart(2, "0")} {countLabel()}
        </span>
      </div>

      {isLoading && (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--slate-400)" }}>
          {t("userAccount.tickets_loading")}
        </div>
      )}
      {!isLoading && filtered.length === 0 && (
        <div
          className="card card-pad"
          style={{ textAlign: "center", padding: "48px 24px", marginBottom: 32 }}
        >
          <div style={{ fontSize: 15, color: "var(--slate-500)", marginBottom: 12 }}>
            {emptyMessage()}
          </div>
          <Link to="/tickets/new" className="btn btn-primary btn-sm">
            {t("userAccount.tickets_fileNew")}
          </Link>
        </div>
      )}
      {!isLoading && filtered.length > 0 && (
        <>
          <div className="user-tickets-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
            {pageItems.map((ticket) => (
              <TicketCard key={ticket.id} ticket={ticket} />
            ))}
          </div>
          <Pagination page={safePage} total={totalPages} onChange={setPage} />
        </>
      )}
    </>
  );
}
