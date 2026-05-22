import { useState } from "react";

const NOTIF_ITEMS = [
  { key: "providerReplies", title: "Provider replies", sub: "Push + email when assigned" },
  { key: "statusChanges", title: "Status changes", sub: "En route, on site, finished" },
  { key: "quotesEstimates", title: "Quotes & estimates", sub: "Before any work begins" },
  { key: "weeklyDigest", title: "Weekly digest", sub: "Mondays at 8 AM" },
  { key: "marketing", title: "Marketing", sub: "New providers in area" },
] as const;

type NotifKey = (typeof NOTIF_ITEMS)[number]["key"];

export function NotificationsCard() {
  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>({
    providerReplies: true,
    statusChanges: true,
    quotesEstimates: true,
    weeklyDigest: false,
    marketing: false,
  });

  function toggle(key: NotifKey) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }));
  }

  return (
    <div className="rail-card">
      <div className="rail-head">
        <span className="num">N1</span>
        <span className="label">Notifications</span>
      </div>
      {NOTIF_ITEMS.map(({ key, title, sub }) => (
        <div className="rail-row" key={key}>
          <div>
            <div style={{ fontWeight: 500 }}>{title}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{sub}</div>
          </div>
          <button
            className="toggle"
            aria-checked={prefs[key]}
            onClick={() => toggle(key)}
          >
            <span className="toggle-track" />
          </button>
        </div>
      ))}
    </div>
  );
}
