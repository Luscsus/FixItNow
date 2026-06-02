import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { useCurrentProvider } from "@/hooks/useCurrentProvider";
import { updateNotificationPreferences } from "@/services/userService";

type NotifKey = "inboundRequests" | "customerReplies" | "jobStatusChanges" | "reviewsReceived";

const NOTIF_KEYS: NotifKey[] = ["inboundRequests", "customerReplies", "jobStatusChanges", "reviewsReceived"];

const DEFAULTS: Record<NotifKey, boolean> = {
  inboundRequests: true,
  customerReplies: true,
  jobStatusChanges: true,
  reviewsReceived: true,
};

export function NotificationsCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data: provider } = useCurrentProvider();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>(DEFAULTS);

  useEffect(() => {
    if (provider?.notificationPreferences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <span className="label">{t("providerAccount.notif_title")}</span>
      </div>
      {NOTIF_KEYS.map((key) => (
        <div className="rail-row" key={key}>
          <div>
            <div style={{ fontWeight: 500 }}>{t(`providerAccount.notif_${key}_title`)}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{t(`providerAccount.notif_${key}_sub`)}</div>
          </div>
          <button
            className="toggle"
            role="switch"
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
