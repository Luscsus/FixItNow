import { useEffect, useState } from "react";

const DISMISS_KEY = "pwa-install-dismissed-until";
const DISMISS_DAYS = 14;

function isDismissed(): boolean {
  try {
    const val = localStorage.getItem(DISMISS_KEY);
    if (!val) return false;
    return Date.now() < parseInt(val, 10);
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(
      DISMISS_KEY,
      String(Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000),
    );
  } catch {
    // ignore
  }
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isInStandaloneMode(): boolean {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    ("standalone" in navigator && (navigator as { standalone?: boolean }).standalone === true)
  );
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [showIosHint, setShowIosHint] = useState(
    () => !isInStandaloneMode() && !isDismissed() && isIos(),
  );

  useEffect(() => {
    // Never show if already installed, user recently dismissed, or on iOS
    if (isInStandaloneMode() || isDismissed() || isIos()) return;

    // Chrome / Android path
    function handler(e: Event) {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    }
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setShowBanner(false);
      setDeferredPrompt(null);
    }
  }

  function handleDismiss() {
    dismiss();
    setShowBanner(false);
    setShowIosHint(false);
  }

  if (!showBanner && !showIosHint) return null;

  // ── iOS share-sheet hint ──────────────────────────────────────────────────
  if (showIosHint) {
    return (
      <div className="install-banner install-banner--ios">
        <div className="install-banner-icon" aria-hidden="true">
          <img src="/icon.svg" alt="" width={36} height={36} />
        </div>
        <div className="install-banner-text">
          <strong>Add FixItNow to your Home Screen</strong>
          <span>
            Tap{" "}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ verticalAlign: "middle", display: "inline" }}>
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>{" "}
            then <strong>Add to Home Screen</strong>
          </span>
        </div>
        <button
          className="install-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Dismiss install prompt"
          type="button"
        >
          ✕
        </button>
      </div>
    );
  }

  // ── Chrome / Android install banner ──────────────────────────────────────
  return (
    <div className="install-banner">
      <div className="install-banner-icon" aria-hidden="true">
        <img src="/icon.svg" alt="" width={36} height={36} />
      </div>
      <div className="install-banner-text">
        <strong>Install FixItNow</strong>
        <span>Faster access, works like a native app</span>
      </div>
      <div className="install-banner-actions">
        <button
          className="btn btn-primary btn-sm"
          onClick={handleInstall}
          type="button"
        >
          Install
        </button>
        <button
          className="install-banner-dismiss"
          onClick={handleDismiss}
          aria-label="Not now"
          type="button"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
