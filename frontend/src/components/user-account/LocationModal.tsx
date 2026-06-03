import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useUserLocation } from "@/hooks/useUserLocation";
import { getErrorMessage } from "@/lib/errorMessage";
import { AddressAutocomplete } from "@/components/tickets/AddressAutocomplete";
import type { AddressSuggestion } from "@/services/geocodeService";

interface Props {
  open: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

/** Centered modal for adding / editing the user's default location. */
export function LocationModal({ open, onClose, onSaved }: Readonly<Props>) {
  const { t } = useTranslation();
  const { saved, saveMutation } = useUserLocation();

  const [address, setAddress] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Seed the form from the saved location every time the modal opens.
  useEffect(() => {
    if (!open) return;
    setAddress(saved?.address ?? "");
    setCoords(
      saved?.latitude != null && saved?.longitude != null
        ? { lat: saved.latitude, lng: saved.longitude }
        : null,
    );
    setError(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Close on Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !saveMutation.isPending) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose, saveMutation.isPending]);

  if (!open) return null;

  function handleSave() {
    setError(null);
    if (!address.trim()) {
      setError(t("userAccount.buildings_errorEmpty"));
      return;
    }
    saveMutation.mutate(
      { address: address.trim(), latitude: coords?.lat ?? null, longitude: coords?.lng ?? null },
      {
        onSuccess: () => { onSaved?.(); onClose(); },
        onError: (e: Error) => setError(getErrorMessage(e)),
      },
    );
  }

  const isEdit = Boolean(saved);

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,23,42,0.5)", backdropFilter: "blur(2px)",
        display: "grid", placeItems: "center", padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !saveMutation.isPending) onClose(); }}
    >
      <div style={{
        background: "#fff", borderRadius: 18, padding: 28,
        width: "100%", maxWidth: 480, boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start", marginBottom: 18 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--navy-50, #eef2ff)", color: "var(--accent-deep, #1e3a8a)",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "3px 0 4px", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {isEdit ? t("userAccount.buildings_modalEdit") : t("userAccount.buildings_modalAdd")}
            </h3>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
              {t("userAccount.buildings_addressHint")}
            </p>
          </div>
        </div>

        <div className="field">
          <label className="field-label">{t("userAccount.buildings_addressLabel")}</label>
          <AddressAutocomplete
            value={address}
            resolved={coords !== null}
            hasError={Boolean(error)}
            placeholder={t("newTicket.locationPlaceholder")}
            onTextChange={(text) => { setAddress(text); setCoords(null); setError(null); }}
            onSelect={(s: AddressSuggestion) => { setAddress(s.displayName); setCoords({ lat: s.lat, lng: s.lng }); setError(null); }}
          />
        </div>

        {error && (
          <div style={{ marginTop: 12, fontSize: 12.5, color: "#B91C1C", background: "#FEE2E2", padding: "8px 10px", borderRadius: 8 }}>
            {error}
          </div>
        )}

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onClose} disabled={saveMutation.isPending}>
            {t("userAccount.buildings_cancel")}
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saveMutation.isPending}>
            {saveMutation.isPending ? t("userAccount.buildings_saving") : t("userAccount.buildings_save")}
          </button>
        </div>
      </div>
    </div>
  );
}
