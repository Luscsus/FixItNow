import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { updateNotificationPreferences } from "@/services/userService";

type NotifKey = "providerReplies" | "statusChanges";

const NOTIF_KEYS: NotifKey[] = ["providerReplies", "statusChanges"];

const DEFAULTS: Record<NotifKey, boolean> = {
  providerReplies: true,
  statusChanges: true,
};

export function NotificationsCard() {
  const { t } = useTranslation();
  const { accessToken } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const [prefs, setPrefs] = useState<Record<NotifKey, boolean>>(DEFAULTS);

  useEffect(() => {
    if (user?.notificationPreferences) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
        <span className="label">{t("userAccount.notif_title")}</span>
      </div>
      {NOTIF_KEYS.map((key) => (
        <div className="rail-row" key={key}>
          <div>
            <div style={{ fontWeight: 500 }}>{t(`userAccount.notif_${key}_title`)}</div>
            <div className="muted" style={{ fontSize: 12, marginTop: 2 }}>{t(`userAccount.notif_${key}_sub`)}</div>
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
