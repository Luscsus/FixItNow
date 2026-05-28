import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { useTicketsQuery } from "@/hooks/useTicketsQuery";
import type { TicketStatus } from "@/domain/ticket";
import { TicketCard } from "@/components/tickets/TicketCard";

const TERMINAL_STATUSES: TicketStatus[] = ["COMPLETED", "DECLINED", "CANCELLED"];

type Filter = "active" | "resolved" | "all";

export function TicketsTab() {
  const { data: tickets = [], isLoading } = useTicketsQuery();
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = useMemo(() => {
    if (filter === "active") return tickets.filter((t) => !TERMINAL_STATUSES.includes(t.status));
    if (filter === "resolved") return tickets.filter((t) => TERMINAL_STATUSES.includes(t.status));
    return tickets;
  }, [tickets, filter]);

  return (
    <>
      <div className="row" style={{ marginBottom: 20, gap: 12, alignItems: "center" }}>
        <div className="segment">
          <button aria-pressed={filter === "active"} onClick={() => setFilter("active")}>Active</button>
          <button aria-pressed={filter === "resolved"} onClick={() => setFilter("resolved")}>Resolved</button>
          <button aria-pressed={filter === "all"} onClick={() => setFilter("all")}>All</button>
        </div>
        <span className="grow" />
        <Link to="/tickets/new" className="btn btn-primary btn-sm">+ New ticket</Link>
      </div>

      <div className="panel-title">
        <span className="num">01</span>
        <span className="label">
          {filter === "active" ? "Active tickets" : filter === "resolved" ? "Resolved tickets" : "All tickets"}
        </span>
        <span className="rule" />
        <span className="mono muted" style={{ fontSize: 11.5 }}>
          {String(filtered.length).padStart(2, "0")} {filter === "active" ? "ACTIVE" : filter === "resolved" ? "RESOLVED" : "TOTAL"}
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: "48px 0", textAlign: "center", color: "var(--slate-400)" }}>
          Loading tickets…
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="card card-pad"
          style={{ textAlign: "center", padding: "48px 24px", marginBottom: 32 }}
        >
          <div style={{ fontSize: 15, color: "var(--slate-500)", marginBottom: 12 }}>
            {filter === "active"
              ? "No active tickets yet."
              : filter === "resolved"
                ? "No resolved tickets yet."
                : "You haven't filed any tickets yet."}
          </div>
          <Link to="/tickets/new" className="btn btn-primary btn-sm">
            + File a new ticket
          </Link>
        </div>
      ) : (
        <div className="user-tickets-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {filtered.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} />
          ))}
        </div>
      )}
    </>
  );
}
