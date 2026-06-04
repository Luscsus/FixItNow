import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  useAdminDeleteTicketMutation,
  useAdminTickets,
  useAdminUpdateTicketMutation,
} from "@/hooks/useAdminTickets";
import { useToast } from "@/components/ui/toast";
import { StyledSelect } from "@/components/ui/StyledSelect";
import { SearchField } from "@/components/ui/SearchField";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import type { Ticket, TicketPriority, TicketStatus } from "@/domain/ticket";

const PAGE_SIZE = 12;

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
  const { t } = useTranslation();
  const { data: tickets = [], isLoading, error } = useAdminTickets();
  const { notify } = useToast();
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [confirmDelete, setConfirmDelete] = useState<Ticket | null>(null);

  const update = useAdminUpdateTicketMutation();
  const remove = useAdminDeleteTicketMutation();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tickets;
    return tickets.filter((tk) =>
      [
        ticketCode(tk.id),
        tk.serviceType,
        tk.submittedByName ?? "",
        tk.assignedServiceProviderName ?? "",
        tk.status,
      ].join(" ").toLowerCase().includes(q),
    );
  }, [tickets, query]);

  const { pageItems, totalPages, safePage } = usePaginatedItems(filtered, page, PAGE_SIZE);

  function handleStatusChange(tk: Ticket, status: string) {
    update.mutate(
      { id: tk.id, status: status as TicketStatus },
      {
        onSuccess: () => notify(t("admin.statusUpdated", { code: ticketCode(tk.id) }), "success"),
        onError: () => notify(t("admin.failedStatus"), "error"),
      },
    );
  }

  function handlePriorityChange(tk: Ticket, priority: string) {
    update.mutate(
      { id: tk.id, priority: priority as TicketPriority },
      {
        onSuccess: () => notify(t("admin.priorityUpdated", { code: ticketCode(tk.id) }), "success"),
        onError: () => notify(t("admin.failedPriority"), "error"),
      },
    );
  }

  function confirmDeleteTicket() {
    const tk = confirmDelete;
    if (!tk) return;
    remove.mutate(tk.id, {
      onSuccess: () => {
        notify(t("admin.ticketDeleted", { code: ticketCode(tk.id) }), "success");
        setConfirmDelete(null);
      },
      onError: () => notify(t("admin.failedDeleteTicket"), "error"),
    });
  }

  const busy = update.isPending || remove.isPending;

  return (
    <section className="admin-page" style={{ flex: 1, overflowY: "auto", padding: "28px 32px 80px" }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", gap: 16, flexWrap: "wrap", marginBottom: 20 }}>
          <div>
            <span className="eyebrow">Console · {t("admin.ticketMgmt")}</span>
            <h1 style={{ fontSize: "clamp(22px, 2.4vw, 30px)", fontWeight: 700, letterSpacing: "-0.025em", margin: "6px 0 0" }}>
              {t("admin.allTickets")} <span style={{ color: "var(--text-muted)", fontWeight: 500 }}>· {tickets.length}</span>
            </h1>
          </div>
          <span style={{ flex: 1 }} />
          <SearchField
            value={query}
            onChange={(e) => { setQuery(e.target.value); setPage(1); }}
            placeholder={t("admin.searchTickets")}
            containerStyle={{ maxWidth: 360, minWidth: 240 }}
          />
        </div>

        {isLoading && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{t("admin.loadingTickets")}</div>}
        {error && <div style={{ padding: 40, textAlign: "center", color: "var(--red-600)" }}>{t("admin.failedTickets")}</div>}

        {!isLoading && !error && (
          <div className="admin-table" style={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 14, overflow: "hidden" }}>
            <div className="admin-table-head" style={{
              display: "grid",
              gridTemplateColumns: "minmax(200px, 2fr) 1.2fr 1.2fr 180px 130px 90px",
              gap: 12,
              padding: "12px 18px",
              borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
              color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase",
            }}>
              <div>{t("admin.colTicket")}</div>
              <div>{t("admin.colCustomer")}</div>
              <div>{t("admin.colProvider")}</div>
              <div>{t("admin.colStatus")}</div>
              <div>{t("admin.colPriority")}</div>
              <div style={{ textAlign: "right" }}>{t("admin.colAction")}</div>
            </div>

            {filtered.length === 0 && (
              <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>{t("admin.noTicketsMatch")}</div>
            )}

            {pageItems.map((tk) => (
              <div key={tk.id} className="admin-table-row" style={{
                display: "grid",
                gridTemplateColumns: "minmax(200px, 2fr) 1.2fr 1.2fr 180px 130px 90px",
                gap: 12,
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}>
                <div style={{ minWidth: 0 }}>
                  <Link
                    to={`/tickets/${tk.id}`}
                    style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--navy-700, #142C5E)", textDecoration: "none", fontWeight: 700, letterSpacing: "0.04em" }}
                  >
                    {ticketCode(tk.id)}
                  </Link>
                  <div style={{ fontSize: 14, fontWeight: 600, letterSpacing: "-0.01em", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {tk.serviceType}
                  </div>
                </div>

                <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tk.submittedByName ?? "—"}
                </div>

                <div style={{ fontSize: 13, color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {tk.assignedServiceProviderName ?? t("admin.unassigned")}
                </div>

                <div>
                  <StyledSelect
                    value={tk.status}
                    disabled={busy}
                    onChange={(e) => handleStatusChange(tk, e.target.value)}
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>{s.replaceAll("_", " ")}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div>
                  <StyledSelect
                    value={tk.priority ?? "MEDIUM"}
                    disabled={busy}
                    onChange={(e) => handlePriorityChange(tk, e.target.value)}
                  >
                    {PRIORITIES.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </StyledSelect>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button
                    className="btn btn-sm"
                    disabled={busy}
                    onClick={() => setConfirmDelete(tk)}
                    style={{ background: "var(--red-100)", color: "var(--red-700)", border: "1px solid #FCA5A5" }}
                  >
                    {t("common.delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && !error && <Pagination page={safePage} total={totalPages} onChange={setPage} />}

        <p style={{ marginTop: 14, fontSize: 12.5, color: "var(--text-muted)" }}>
          {t("admin.adminNote")}
        </p>
      </div>

      <ConfirmDialog
        open={confirmDelete !== null}
        title={t("admin.deleteTicket_title")}
        confirmLabel={t("admin.deleteTicket_label")}
        loadingLabel={t("admin.deleteTicket_loading")}
        loading={remove.isPending}
        onConfirm={confirmDeleteTicket}
        onCancel={() => setConfirmDelete(null)}
      >
        {confirmDelete && (
          <>
            {t("admin.deleteTicket_about")}{" "}
            <strong style={{ color: "var(--text)" }}>{ticketCode(confirmDelete.id)}</strong>{" "}
            (<span>{confirmDelete.serviceType}</span>). {t("admin.deleteTicket_body")}
          </>
        )}
      </ConfirmDialog>
    </section>
  );
}
