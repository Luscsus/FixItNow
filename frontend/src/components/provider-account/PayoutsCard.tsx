import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { usePayouts, type PayoutStatus } from "@/hooks/usePayouts";

const STATUS_STYLE: Record<PayoutStatus, { bg: string; fg: string }> = {
  Completed:  { bg: "var(--emerald-100, #d1fae5)", fg: "var(--emerald-700, #047857)" },
  Pending:    { bg: "var(--amber-100, #fef3c7)",   fg: "var(--amber-800, #92400e)" },
  Processing: { bg: "var(--blue-50, #eff6ff)",     fg: "var(--blue-700, #1d4ed8)" },
  Failed:     { bg: "#FEE2E2",                       fg: "#B91C1C" },
};

export function PayoutsCard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { payouts, totalPaid, pendingTotal, isLoading, isError, refetch, isFetching } = usePayouts();

  const fmtMoney = (n: number) =>
    `$${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: Date) =>
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toUpperCase();
  const statusLabel = (s: PayoutStatus) => t(`providerAccount.payoutStatus_${s.toLowerCase()}`);

  const recent = payouts.slice(0, 3);

  return (
    <div className="rail-card">
      <div className="rail-head">
        <span className="num">P2</span>
        <span className="label">{t("providerAccount.payouts_title")}</span>
      </div>

      {/* Hero: pending total awaiting deposit */}
      <div style={{ background: "var(--navy-50)", border: "1px solid var(--navy-100)", borderRadius: 10, padding: 14, marginBottom: 14 }}>
        <div className="mono" style={{ fontSize: 10.5, color: "var(--navy-700)", letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 }}>
          {t("providerAccount.payouts_pending")}
        </div>
        <div className="mono" style={{ fontSize: 28, fontWeight: 600, letterSpacing: "-0.03em", marginTop: 6, color: "var(--navy-900)" }}>
          {isLoading ? "—" : fmtMoney(pendingTotal)}
        </div>
        <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>
          {t("providerAccount.payouts_totalPaid")}: {isLoading ? "—" : fmtMoney(totalPaid)}
        </div>
      </div>

      {/* Recent payouts */}
      {isLoading ? (
        <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>
          {t("providerAccount.payouts_loading")}
        </div>
      ) : isError ? (
        <div style={{ fontSize: 13, padding: "8px 0" }}>
          <div style={{ color: "#B91C1C", marginBottom: 8 }}>{t("providerAccount.payouts_error")}</div>
          <button className="btn btn-secondary btn-sm" onClick={() => refetch()} disabled={isFetching}>
            {isFetching ? t("providerAccount.payouts_loading") : t("providerAccount.payouts_retry")}
          </button>
        </div>
      ) : recent.length === 0 ? (
        <div className="muted" style={{ fontSize: 13, padding: "8px 0" }}>
          {t("providerAccount.payouts_emptyTitle")}
        </div>
      ) : (
        recent.map((p) => (
          <div className="payout-row" key={p.id}>
            <div>
              <div className="payout-date">{fmtDate(p.date)}</div>
              <div className="payout-meta">
                {p.reference} ·{" "}
                <span style={{ color: STATUS_STYLE[p.status].fg, fontWeight: 600 }}>
                  {statusLabel(p.status)}
                </span>
              </div>
            </div>
            <span className="payout-amt">{p.amount > 0 ? fmtMoney(p.amount) : "—"}</span>
          </div>
        ))
      )}

      <button
        className="btn btn-secondary btn-sm btn-full"
        style={{ marginTop: 14 }}
        onClick={() => navigate("/dashboard/provider/payouts")}
      >
        {t("providerAccount.payouts_viewAll")}
      </button>
    </div>
  );
}
