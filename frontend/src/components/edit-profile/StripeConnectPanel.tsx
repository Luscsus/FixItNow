import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { getConnectStatus, refreshConnectStatus, startConnectOnboarding } from "@/services/connectService";
import { getErrorMessage } from "@/lib/errorMessage";

/**
 * Stripe Connect onboarding for the provider's payouts. Without a connected,
 * charges-enabled account, customer payments can't be routed to the provider —
 * so this is the primary payout setup. Handles the return from Stripe's hosted
 * onboarding (?connect=done) by refreshing the status.
 */
export function StripeConnectPanel() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { data: status, isLoading } = useQuery({
    queryKey: ["connectStatus"],
    queryFn: () => getConnectStatus(accessToken),
    enabled: !!accessToken,
  });

  // Returning from Stripe-hosted onboarding — pull fresh status, then clear param.
  useEffect(() => {
    const connect = searchParams.get("connect");
    if (connect !== "done" && connect !== "refresh") return;
    const next = new URLSearchParams(searchParams);
    next.delete("connect");
    setSearchParams(next, { replace: true });
    refreshConnectStatus(accessToken)
      .then(() => queryClient.invalidateQueries({ queryKey: ["connectStatus"] }))
      .catch(() => { /* status query will retry on its own */ });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const handleConnect = async () => {
    setStarting(true);
    setError(null);
    try {
      const url = await startConnectOnboarding(accessToken);
      window.location.href = url;
    } catch (err) {
      setError(getErrorMessage(err) || t("connect.error"));
      setStarting(false);
    }
  };

  const active = !!status?.chargesEnabled;
  const pending = !!status?.connected && !status?.chargesEnabled;

  return (
    <div style={{ marginBottom: 16, padding: 16, borderRadius: 12, border: "1px solid var(--border)", background: "var(--surface-2, #f8fafc)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
        <span className="mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 600 }}>
          {t("connect.title")}
        </span>
        {active && (
          <span className="pill pill-resolved" style={{ fontSize: 11 }}><span className="dot" />{t("connect.badgeActive")}</span>
        )}
        {pending && (
          <span className="pill pill-pending" style={{ fontSize: 11 }}><span className="dot" />{t("connect.badgePending")}</span>
        )}
      </div>
      <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5, marginBottom: 12 }}>
        {t("connect.desc")}
      </div>

      {isLoading ? (
        <div className="muted" style={{ fontSize: 13 }}>{t("connect.refreshing")}</div>
      ) : active ? (
        <div role="status" style={{ fontSize: 13, color: "var(--emerald-700)" }}>
          {t("connect.active")}
          {!status?.payoutsEnabled && (
            <div className="muted" style={{ fontSize: 12, marginTop: 4 }}>{t("connect.payoutsPending")}</div>
          )}
        </div>
      ) : (
        <>
          {pending && (
            <div role="alert" style={{ marginBottom: 10, fontSize: 13, color: "var(--amber-900, #78350f)" }}>
              {t("connect.pending")}
            </div>
          )}
          <button type="button" className="btn btn-primary btn-sm" disabled={starting} onClick={handleConnect}>
            {starting ? t("connect.starting") : pending ? t("connect.continue") : t("connect.setup")}
          </button>
        </>
      )}

      {error && (
        <div style={{ marginTop: 10, fontSize: 12, color: "#B91C1C", background: "#FEE2E2", padding: "6px 10px", borderRadius: 6 }}>
          {error}
        </div>
      )}
    </div>
  );
}
