import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  useAdminDeleteTicketMutation,
  useAdminTickets,
  useAdminUpdateTicketMutation,
} from "@/hooks/useAdminTickets";
import { useToast } from "@/components/ui/toast";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { SearchField } from "@/components/ui/SearchField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";

const STATUSES: TicketStatus[] = [
  "PENDING_APPROVAL",
  "APPROVED",
  "IN_TRANSIT",
  "PENDING_PROVIDER_INVOICE",
  "PENDING_PAYMENT",
  "COMPLETED",
  "DECLINED",
  "CANCELLED",
];

const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

function ticketCode(id: number) {
  return `FIX-${String(id).padStart(4, "0")}`;
}

export function AdminTicketsPage() {
  const { data: tickets = [], isLoading, error } = useAdminTickets();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [confirmDelete, setConfirmDelete] = useState<Ticket | null>(null);

  const update = useAdminUpdateTicketMutation();
  const remove = useAdminDeleteTicketMutation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((t) =>
      [
        ticketCode(t.id),
        t.serviceType,
        t.submittedByName ?? "",
        t.assignedServiceProviderName ?? "",
        t.status,
      ].join(" ").toLowerCase().includes(q),
    );
  }, [tickets, query]);

  function handleStatusChange(t: Ticket, status: string) {
    update.mutate(
      { id: t.id, status: status as TicketStatus },
      {
        onSuccess: () => notify(`${ticketCode(t.id)} status updated.`, "success"),
        onError: () => notify("Failed to update status.", "error"),
      },
    );
  }

  function handlePriorityChange(t: Ticket, priority: string) {
    update.mutate(
      { id: t.id, priority: priority as TicketPriority },
      {
        onSuccess: () => notify(`${ticketCode(t.id)} priority updated.`, "success"),
        onError: () => notify("Failed to update priority.", "error"),
      },
    );
  }

  function confirmDeleteTicket() {
    const t = confirmDelete;
    if (!t) return;
    remove.mutate(t.id, {
      onSuccess: () => {
        notify(`${ticketCode(t.id)} deleted.`, "success");
        setConfirmDelete(null);
      },
      onError: () => notify("Failed to delete ticket.", "error"),
    });
  }

  const busy = update.isPending || remove.isPending;

  return (
    <section style={{ flex: 1, overflowY: "auto", padding: "28px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Console · Ticket management</span>
            <h1 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 0" }}>
              All tickets <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {tickets.length}</span>
            </h1>
          </div>
          <span style={{ flex: 1 }} />
          <SearchField
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search code, service, customer, provider…"
            containerStyle={{ maxWidth: 360, minWidth: 240 }}
          />
        </div>

        {isLoading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>Loading tickets…</div>}
        {error && <div style={{ padding: 40, textAlign: "center", color: "var(--red-600)" }}>Failed to load tickets.</div>}

        {!isLoading && !error && (
          <div style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "minmax(200px, 2fr) 1.2fr 1.2fr 180px 130px 90px",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
              color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              <div>Ticket</div>
              <div>Customer</div>
              <div>Provider</div>
              <div>Status</div>
              <div>Priority</div>
              <div style={{ textAlign: "right" }}>Action</div>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>No tickets match your search.</div>
            )}

            {filtered.map((t) => (
              <div key={t.id} style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 2fr) 1.2fr 1.2fr 180px 130px 90px",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}>
                {/* Ticket */}
                <div style={{ minWidth: 0 }}>
                  <Link
                    to={`/tickets/${t.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--navy-700, #142C5E)", textDecoration: "none", fontWeight: 700, letterSpacing: "0.04em" }}
                  >
                    {ticketCode(t.id)}
                  </Link>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {t.serviceType}
                  </div>
                </div>

                {/* Customer */}
                <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.submittedByName ?? "—"}
                </div>

                {/* Provider */}
                <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {t.assignedServiceProviderName ?? "Unassigned"}
                </div>

                {/* Status */}
                <div>
                  <StyledSelect
                    value={t.status}
                    disabled={busy}
                    onChange={(e) => handleStatusChange(t, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, " ")}</option>
                    ))}
                  </StyledSelect>
                </div>

                {/* Priority */}
                <div>
                  <StyledSelect
                    value={t.priority ?? "MEDIUM"}
                    disabled={busy}
                    onChange={(e) => handlePriorityChange(t, e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </StyledSelect>
                </div>

                {/* Action */}
                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => setConfirmDelete(t)}
                    style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
          Admin status changes bypass the normal ticket lifecycle. The customer is notified of the change.
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title="Delete this ticket?"
        confirmLabel="Delete ticket"
        loadingLabel="Deleting…"
        loading={remove.isPending}
        onConfirm={confirmDeleteTicket}
        onCancel={() => setConfirmDelete(null)}
      >
        {confirmDelete && (
          <>
            You're about to delete{" "}
            <strong style={{ color: "var(--text)" }}>{ticketCode(confirmDelete.id)}</strong>{" "}
            (<span>{confirmDelete.serviceType}</span>). This permanently removes the ticket and its history and can't be undone.
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
