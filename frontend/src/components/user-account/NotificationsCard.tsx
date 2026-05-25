import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { updateNotificationPreferences } from "@/services/userService";

const NOTIF_ITEMS = [
  { key: "providerReplies", title: "Provider replies", sub: "When a provider replies to your ticket" },
  { key: "statusChanges", title: "Status changes", sub: "When the status of your ticket changes" },
] as const;

type NotifKey = (typeof NOTIF_ITEMS)[number]["key"];

const DEFAULTS: Record<NotifKey, boolean> = {
  providerReplies: true,
  statusChanges: true,
};

export function NotificationsCard() {
  const { accessToken } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>(DEFAULTS);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs({
        providerReplies: user.notificationPreferences.providerReplies ?? true,
        statusChanges: user.notificationPreferences.statusChanges ?? true,
      });
    }
  }, [user]);

  const mutation = useMutation({
    mutationFn: (next: Record<NotifKey, boolean>) =>
      updateNotificationPreferences(accessToken, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUser"] });
    },
  });

  function toggle(key: NotifKey) {
    const prev = prefs;
    const next = { ...prev, [key]: !prev[key] };
    setPrefs(next);
    mutation.mutate(next, {
      onError: () => setPrefs(prev),
    });
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
