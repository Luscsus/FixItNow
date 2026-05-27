import type { ReactNode } from "react";

function WarningIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  children: ReactNode;
  confirmLabel: string;
  loadingLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  loadingLabel,
  cancelLabel = "Cancel",
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "rgba(15,23,42,0.5)",
        backdropFilter: "blur(2px)",
        display: "grid", placeItems: "center",
        padding: 24,
      }}
      onClick={(e) => { if (e.target === e.currentTarget && !loading) onCancel(); }}
    >
      <div style={{
        background: "#fff",
        borderRadius: 18,
        padding: 28,
        width: "100%", maxWidth: 440,
        boxShadow: "var(--shadow-lg)",
        border: "1px solid var(--border)",
      }}>
        <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12,
            background: "var(--red-100)", color: "var(--red-700)",
            display: "grid", placeItems: "center", flexShrink: 0,
          }}>
            <WarningIcon />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: "3px 0 8px", fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em", color: "var(--text)" }}>
              {title}
            </h3>
            <div style={{ fontSize: 14, color: "var(--text-muted)", lineHeight: 1.55 }}>
              {children}
            </div>
          </div>
        </div>
        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
          <button className="btn btn-secondary" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            className="btn"
            onClick={onConfirm}
            disabled={loading}
            style={{ background: "var(--red-600)", color: "#fff", border: "1px solid var(--red-600)" }}
          >
            {loading ? (loadingLabel ?? `${confirmLabel}…`) : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
