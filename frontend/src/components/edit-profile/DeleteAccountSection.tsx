import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { deleteOwnAccount } from "@/services/userService";
import { getErrorMessage } from "@/lib/errorMessage";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

/**
 * "Danger zone" — lets a customer or provider permanently leave the platform.
 * The account is SOFT-deleted server-side (historical data is preserved); on
 * success the session is cleared and the user is logged out immediately.
 */
export function DeleteAccountSection() {
  const { t } = useTranslation();
  const { accessToken, clearSession } = useAuth();
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = async () => {
    setLoading(true);
    setError(null);
    try {
      await deleteOwnAccount(accessToken);
      clearSession();         // logged out immediately
      navigate("/", { replace: true });
    } catch (e) {
      // Blocked deletions (active tickets/payouts/disputes) land here.
      setError(getErrorMessage(e));
      setLoading(false);
    }
  };

  return (
    <section style={{ marginTop: 40 }}>
      <h2 className="h2" style={{ marginBottom: 16, fontSize: 18, color: "#B91C1C" }}>
        {t("deleteAccount.dangerZone")}
      </h2>
      <div className="card card-pad" style={{ border: "1px solid #FCA5A5" }}>
        <div className="row" style={{ justifyContent: "space-between", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{t("deleteAccount.heading")}</div>
            <p className="muted" style={{ fontSize: 13.5, margin: "4px 0 0", lineHeight: 1.5 }}>
              {t("deleteAccount.sectionDesc")}
            </p>
          </div>
          <button
            type="button"
            className="btn"
            style={{ background: "#DC2626", color: "#fff", flexShrink: 0, whiteSpace: "nowrap" }}
            onClick={() => { setError(null); setOpen(true); }}
          >
            {t("deleteAccount.button")}
          </button>
        </div>
      </div>

      <ConfirmDialog
        open={open}
        title={t("deleteAccount.title")}
        confirmLabel={t("deleteAccount.button")}
        cancelLabel={t("deleteAccount.cancel")}
        loadingLabel={t("deleteAccount.deleting")}
        loading={loading}
        onCancel={() => { if (!loading) { setOpen(false); setError(null); } }}
        onConfirm={handleConfirm}
      >
        <p style={{ margin: 0, lineHeight: 1.55 }}>{t("deleteAccount.message")}</p>
        {error && (
          <div style={{ marginTop: 12, fontSize: 13, color: "#B91C1C", background: "#FEE2E2", border: "1px solid #FCA5A5", padding: "8px 12px", borderRadius: 8, lineHeight: 1.5 }}>
            {error}
          </div>
        )}
      </ConfirmDialog>
    </section>
  );
}
