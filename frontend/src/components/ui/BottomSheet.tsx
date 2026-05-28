import { useEffect } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** If true, renders a regular centered modal on desktop instead of a bottom sheet. */
  desktopAsModal?: boolean;
  /** Optional max height (default 85vh on mobile). */
  maxHeight?: string;
}

export function BottomSheet({
  open,
  onClose,
  title,
  children,
  desktopAsModal = true,
  maxHeight = "85vh",
}: BottomSheetProps) {
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`bottom-sheet-backdrop${desktopAsModal ? " bottom-sheet--desktop-modal" : ""}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bottom-sheet" style={{ maxHeight }}>
        <div className="bottom-sheet-handle" aria-hidden="true" />
        {title && (
          <div className="bottom-sheet-header">
            <h2 className="bottom-sheet-title">{title}</h2>
            <button type="button" className="bottom-sheet-close" onClick={onClose} aria-label="Close">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        )}
        <div className="bottom-sheet-body">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
