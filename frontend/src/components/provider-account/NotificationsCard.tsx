import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { updateNotificationPreferences } from "@/services/userService";

const NOTIF_ITEMS = [
  { key: "inboundRequests", title: "Inbound requests", sub: "When a new ticket matches your trade and area" },
  { key: "customerReplies", title: "Customer replies", sub: "When a customer messages you on a ticket" },
  { key: "jobStatusChanges", title: "Job status changes", sub: "When a ticket you're handling changes status" },
  { key: "reviewsReceived", title: "Reviews received", sub: "When a customer leaves you a review" },
] as const;

type NotifKey = (typeof NOTIF_ITEMS)[number]["key"];

const DEFAULTS: Record<NotifKey, boolean> = {
  inboundRequests: true,
  customerReplies: true,
  jobStatusChanges: true,
  reviewsReceived: true,
};

export function NotificationsCard() {
  const { accessToken } = useAuth();
  const { data: provider } = useCurrentProvider();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>(DEFAULTS);

  useEffect(() => {
    if (provider?.notificationPreferences) {
      setPrefs({
        inboundRequests: provider.notificationPreferences.inboundRequests ?? true,
        customerReplies: provider.notificationPreferences.customerReplies ?? true,
        jobStatusChanges: provider.notificationPreferences.jobStatusChanges ?? true,
        reviewsReceived: provider.notificationPreferences.reviewsReceived ?? true,
      });
    }
  }, [provider]);

  const mutation = useMutation({
    mutationFn: (next: Record<NotifKey, boolean>) =>
      updateNotificationPreferences(accessToken, next),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentProvider"] });
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
