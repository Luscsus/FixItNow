import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserLocation } from "@/hooks/useUserLocation";
import { LocationModal } from "@/components/user-account/LocationModal";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

export function BuildingsLocationsCard() {
  const { t } = useTranslation();
  const { saved, removeMutation } = useUserLocation();

  const [modalOpen, setModalOpen] = useState(false);
  const [confirmRemove, setConfirmRemove] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  return (
    <>
      <div className="panel-title">
        <span className="num">03</span>
        <span className="label">{t("userAccount.buildings_title")}</span>
        <span className="rule" />
        <button
          className="mono"
          style={{ background: "none", border: 0, color: "var(--accent-deep)", fontSize: 11, letterSpacing: "0.05em", cursor: "pointer" }}
          onClick={() => setModalOpen(true)}
        >
          {saved ? t("userAccount.buildings_editBtn") : t("userAccount.buildings_addBtn")}
        </button>
      </div>

      <div className="card card-pad">
        {saved ? (
          <div className="row" style={{ alignItems: "flex-start", gap: 12, justifyContent: "space-between" }}>
            <div style={{ display: "flex", gap: 10, alignItems: "flex-start", minWidth: 0 }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--accent-deep)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, marginTop: 2 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <div style={{ minWidth: 0 }}>
                <div className="mono" style={{ fontSize: 10, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--text-muted)" }}>
                  {t("userAccount.buildings_defaultLabel")}
                </div>
                <div style={{ fontSize: 14, fontWeight: 600, marginTop: 2, wordBreak: "break-word" }}>{saved.address}</div>
              </div>
            </div>
            <button
              className="btn btn-ghost btn-sm"
              style={{ color: "#B91C1C", flexShrink: 0 }}
              onClick={() => setConfirmRemove(true)}
            >
              {t("userAccount.buildings_remove")}
            </button>
          </div>
        ) : (
          <>
            <p className="muted" style={{ fontSize: 14, margin: 0 }}>{t("userAccount.buildings_desc")}</p>
            <button className="btn btn-secondary btn-sm" style={{ marginTop: 14 }} onClick={() => setModalOpen(true)}>
              {t("userAccount.buildings_addBtn")}
            </button>
          </>
        )}

        {justSaved && (
          <div style={{ marginTop: 12, fontSize: 13, color: "var(--emerald-700)", display: "flex", alignItems: "center", gap: 6 }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6 9 17l-5-5" />
            </svg>
            {t("userAccount.buildings_saved")}
          </div>
        )}
      </div>

      <LocationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => { setJustSaved(true); window.setTimeout(() => setJustSaved(false), 3000); }}
      />

      <ConfirmDialog
        open={confirmRemove}
        title={t("userAccount.buildings_removeTitle")}
        confirmLabel={t("userAccount.buildings_remove")}
        loadingLabel={t("userAccount.buildings_removing")}
        cancelLabel={t("userAccount.buildings_cancel")}
        loading={removeMutation.isPending}
        onCancel={() => setConfirmRemove(false)}
        onConfirm={() =>
          removeMutation.mutate(undefined, { onSuccess: () => setConfirmRemove(false) })
        }
      >
        {t("userAccount.buildings_removeConfirm")}
      </ConfirmDialog>
    </>
  );
}
