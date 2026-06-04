import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Pagination, usePaginatedItems } from "@/components/ui/Pagination";
import { usePayouts, type PayoutStatus } from "@/hooks/usePayouts";

const PAGE_SIZE = 10;

const STATUS_STYLE: Record<PayoutStatus, { bg: string; fg: string }> = {
  Completed:  { bg: "var(--emerald-100, #d1fae5)", fg: "var(--emerald-700, #047857)" },
  Pending:    { bg: "var(--amber-100, #fef3c7)",   fg: "var(--amber-800, #92400e)" },
  Processing: { bg: "var(--blue-50, #eff6ff)",     fg: "var(--blue-700, #1d4ed8)" },
  Failed:     { bg: "#FEE2E2",                       fg: "#B91C1C" },
};

function StatusBadge({ status, label }: { status: PayoutStatus; label: string }) {
  const s = STATUS_STYLE[status];
  return (
    <span
      className="mono"
      style={{
        fontSize: 11, fontWeight: 700, letterSpacing: "0.04em",
        padding: "3px 9px", borderRadius: 999, background: s.bg, color: s.fg,
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

export function ProviderPayoutsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { payouts, totalPaid, pendingTotal, isLoading, isError, refetch, isFetching } = usePayouts();

  const [page, setPage] = useState(1);
  const { pageItems, totalPages, safePage } = usePaginatedItems(payouts, page, PAGE_SIZE);

  const statusLabel = (s: PayoutStatus) => t(`providerAccount.payoutStatus_${s.toLowerCase()}`);
  const fmtDate = (d: Date) => d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  const fmtMoney = (n: number) => `€${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <main className="container" style={{ maxWidth: 920, margin: "0 auto", padding: "28px 24px 80px" }}>
      <div className="crumbs" style={{ marginBottom: 18 }}>
        <Link to="/dashboard/provider" style={{ color: "inherit", textDecoration: "none" }}>
          {t("providerAccount.payouts_backToDashboard")}
        </Link>
        <span className="sep">/</span>
        {t("providerAccount.payouts_title")}
      </div>

      <h1 className="h1" style={{ marginBottom: 6 }}>{t("providerAccount.payouts_pageTitle")}</h1>
      <p className="body muted" style={{ marginTop: 0, marginBottom: 24 }}>
        {t("providerAccount.payouts_pageSubtitle")}
      </p>

      {/* Summary tiles */}
      {!isLoading && !isError && payouts.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginBottom: 24 }}>
          <div className="card card-pad">
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t("providerAccount.payouts_totalPaid")}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtMoney(totalPaid)}</div>
          </div>
          <div className="card card-pad">
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t("providerAccount.payouts_pending")}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{fmtMoney(pendingTotal)}</div>
          </div>
          <div className="card card-pad">
            <div className="mono" style={{ fontSize: 10.5, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>{t("providerAccount.payouts_count")}</div>
            <div style={{ fontSize: 24, fontWeight: 700, marginTop: 4 }}>{payouts.length}</div>
          </div>
        </div>
      )}

      {/* Loading */}
      {isLoading ? (
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px", color: "var(--text-muted)" }}>
          {t("providerAccount.payouts_loading")}
        </div>
      ) : isError ? (
        // Error
        <div className="card card-pad" style={{ textAlign: "center", padding: "40px 24px" }}>
          <p style={{ color: "#B91C1C", margin: "0 0 14px" }}>{t("providerAccount.payouts_error")}</p>
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t("providerAccount.payouts_loading") : t("providerAccount.payouts_retry")}
          </button>
        </div>
      ) : payouts.length === 0 ? (
        // Empty
        <div className="card card-pad" style={{ textAlign: "center", padding: "48px 24px" }}>
          <div style={{ fontSize: 15, color: "var(--text)", fontWeight: 600, marginBottom: 6 }}>{t("providerAccount.payouts_emptyTitle")}</div>
          <div className="muted" style={{ fontSize: 13.5, marginBottom: 18 }}>{t("providerAccount.payouts_emptyDesc")}</div>
          <button className="btn btn-primary btn-sm" onClick={() => navigate("/dashboard/provider")}>
            {t("providerAccount.payouts_goToDashboard")}
          </button>
        </div>
      ) : (
        // Table
        <div className="card" style={{ overflow: "hidden" }}>
          {/* Head row */}
          <div
            style={{
              display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
              gap: 12, padding: "12px 18px", borderBottom: "1px solid var(--border)",
              fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 700,
              color: "var(--text-muted)", letterSpacing: "0.08em", textTransform: "uppercase",
            }}
          >
            <span>{t("providerAccount.payouts_colReference")}</span>
            <span>{t("providerAccount.payouts_colDate")}</span>
            <span>{t("providerAccount.payouts_colStatus")}</span>
            <span style={{ textAlign: "right" }}>{t("providerAccount.payouts_colAmount")}</span>
          </div>

          {pageItems.map((p) => (
            <div
              key={p.id}
              style={{
                display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr 1fr",
                gap: 12, padding: "14px 18px", borderBottom: "1px solid var(--border)",
                alignItems: "center",
              }}
            >
              <Link
                to={`/tickets/${p.id}`}
                className="mono"
                style={{ fontSize: 13, fontWeight: 600, color: "var(--navy-700)", textDecoration: "none" }}
              >
                {p.reference}
              </Link>
              <span style={{ fontSize: 13.5, color: "var(--text)" }}>{fmtDate(p.date)}</span>
              <span><StatusBadge status={p.status} label={statusLabel(p.status)} /></span>
              <span style={{ textAlign: "right", fontSize: 14, fontWeight: 700 }}>
                {p.amount > 0 ? fmtMoney(p.amount) : "—"}
              </span>
            </div>
          ))}

          {totalPages > 1 && (
            <div style={{ padding: "14px 18px" }}>
              <Pagination page={safePage} total={totalPages} onChange={setPage} />
            </div>
          )}
        </div>
      )}
    </main>
  );
}
