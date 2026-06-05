import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { useNotifications } from "@/hooks/useNotifications";
import { useNotificationsSocket } from "@/hooks/useNotificationsSocket";
import { primeNotificationSound } from "@/lib/notificationSound";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { localizeNotification } from "@/lib/notificationText";
import type { AppNotification } from "@/domain/notification";

interface NotifListBodyProps {
  readonly pad: string;
  readonly isLoading: boolean;
  readonly notifications: AppNotification[];
  readonly onItemClick: (n: AppNotification) => void;
}

function NotifListBody({ pad, isLoading, notifications, onItemClick }: NotifListBodyProps) {
  const { t } = useTranslation();
  if (isLoading) {
    return (
      <div style={{ padding: pad, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        {t("common.loading")}
      </div>
    );
  }
  if (notifications.length === 0) {
    return (
      <div style={{ padding: pad, textAlign: "center", fontSize: 13, color: "var(--text-muted)" }}>
        {t("notifications.allCaughtUp")}
      </div>
    );
  }
  return (
    <>
      {notifications.map((n) => {
        const { title, body } = localizeNotification(n, t);
        return (
        <button
          key={n.id}
          onClick={() => onItemClick(n)}
          style={{
            display: "flex", alignItems: "flex-start", gap: 10, width: "100%",
            padding: "13px 16px", textAlign: "left",
            background: n.read ? "transparent" : "rgba(59,130,246,0.05)",
            border: "none", borderBottom: "1px solid rgba(15,23,42,0.05)",
            cursor: "pointer", transition: "background 0.1s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.04)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = n.read ? "transparent" : "rgba(59,130,246,0.05)"; }}
        >
          {n.type === "NEW_MESSAGE" ? <MessageDot /> : <TicketDot />}
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: "block", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{title}</span>
            {body && (
              <span style={{ display: "block", fontSize: 12.5, color: "var(--text-muted)", marginTop: 1 }}>{body}</span>
            )}
            <span style={{ display: "block", fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>{formatRelativeTime(n.createdAt)}</span>
          </span>
        </button>
        );
      })}
    </>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function TicketDot() {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#F59E0B", display: "inline-block", flexShrink: 0, marginTop: 6 }} />;
}

function MessageDot() {
  return <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#3B82F6", display: "inline-block", flexShrink: 0, marginTop: 6 }} />;
}

function formatRelativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function NotificationBell() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { accessToken, refreshSession } = useAuth();
  const { data: currentUser } = useCurrentUser();
  const { notifications, unreadCount, isLoading, markRead, markAllRead, deleteAll } = useNotifications();
  const { isMobile } = useBreakpoint();

  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useNotificationsSocket({
    userId: currentUser?.id ?? null,
    accessToken,
    refreshSession,
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleItemClick(n: AppNotification) {
    setOpen(false);
    if (!n.read) markRead.mutate(n.id);
    const ticketScoped =
      n.type === "TICKET_STATUS_CHANGE" ||
      n.type === "PROVIDER_NEARBY" ||
      n.type === "INBOUND_REQUEST" ||
      n.type === "PAYMENT_RECEIVED";
    if (ticketScoped && n.ticketId != null) {
      navigate(`/tickets/${n.ticketId}`);
    } else if (n.type === "REVIEW_RECEIVED" && currentUser?.id) {
      // Reviews live on the provider's own public profile.
      navigate(`/providers/${currentUser.id}`);
    } else if (n.type === "NEW_MESSAGE" && n.chatRoomId) {
      // Invalidate the rooms list and message cache so ChatPage shows fresh data.
      queryClient.invalidateQueries({ queryKey: ["chatRoomsList"] });
      queryClient.invalidateQueries({ queryKey: ["chatMessages", n.chatRoomId] });
      navigate(`/chat?room=${n.chatRoomId}`);
    }
  }

  const notifList = (
    <div style={{ overflowY: "auto", maxHeight: isMobile ? "60vh" : 380 }}>
      <NotifListBody
        pad={isMobile ? "28px 16px" : "24px 16px"}
        isLoading={isLoading}
        notifications={notifications}
        onItemClick={handleItemClick}
      />
    </div>
  );

  return (
    <div ref={ref} style={{ position: "relative" }}>
      {/* Bell button */}
      <button
        title="Notifications"
        onClick={() => {
          // Request OS-notification permission here — inside a real user
          // gesture — because Safari ignores requestPermission() called from
          // an effect/on mount. No-op once the user has already answered.
          if (typeof Notification !== "undefined" && Notification.permission === "default") {
            Notification.requestPermission().catch(() => { /* dismissed — fine */ });
          }
          // Unlock the audio chime (browser autoplay policy needs a gesture).
          primeNotificationSound();
          setOpen((o) => !o);
        }}
        style={{
          position: "relative",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          width: 36, height: 36, borderRadius: 8,
          background: open ? "rgba(15,23,42,0.06)" : "transparent", border: "none",
          color: open ? "var(--text)" : "var(--text-muted)", cursor: "pointer",
          transition: "background 0.12s, color 0.12s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(15,23,42,0.06)"; (e.currentTarget as HTMLElement).style.color = "var(--text)"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = open ? "rgba(15,23,42,0.06)" : "transparent"; (e.currentTarget as HTMLElement).style.color = open ? "var(--text)" : "var(--text-muted)"; }}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute", top: 2, right: 2,
            minWidth: 16, height: 16, padding: "0 4px",
            borderRadius: 8, background: "#F59E0B", color: "#fff",
            fontSize: 10, fontWeight: 700, lineHeight: "16px", textAlign: "center",
            boxShadow: "0 0 0 2px rgba(250, 250, 247, 0.95)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Mobile: full-screen BottomSheet */}
      {isMobile && (
        <BottomSheet
          open={open}
          onClose={() => setOpen(false)}
          title={t("notifications.title")}
          desktopAsModal={false}
          maxHeight="80vh"
        >
          {notifications.length > 0 && (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, padding: "0 0 12px", borderBottom: "1px solid rgba(15,23,42,0.07)", marginBottom: 4 }}>
              {unreadCount > 0 ? (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--navy-700)", padding: 0 }}
                >
                  {t("notifications.markAllRead")}
                </button>
              ) : <span />}
              <button
                onClick={() => deleteAll.mutate()}
                disabled={deleteAll.isPending}
                style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: 13, fontWeight: 500, color: "var(--red-600)", padding: 0 }}
              >
                {t("notifications.clearAll")}
              </button>
            </div>
          )}
          {notifList}
        </BottomSheet>
      )}

      {/* Desktop: absolute dropdown */}
      {!isMobile && open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 340, maxWidth: "calc(100vw - 32px)",
          background: "var(--card)",
          border: "1px solid rgba(15,23,42,0.1)",
          borderRadius: 10,
          boxShadow: "0 8px 24px rgba(15,23,42,0.12)",
          overflow: "hidden",
          zIndex: 50,
        }}>
          {/* Header */}
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid rgba(15,23,42,0.07)",
          }}>
            <span style={{ fontSize: 13.5, fontWeight: 600, color: "var(--text)" }}>{t("notifications.title")}</span>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              {unreadCount > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  disabled={markAllRead.isPending}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 500, color: "var(--navy-700)",
                    padding: 0,
                  }}
                >
                  {t("notifications.markAllRead")}
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={() => deleteAll.mutate()}
                  disabled={deleteAll.isPending}
                  style={{
                    background: "transparent", border: "none", cursor: "pointer",
                    fontSize: 12, fontWeight: 500, color: "var(--red-600)",
                    padding: 0,
                  }}
                >
                  {t("notifications.clearAll")}
                </button>
              )}
            </div>
          </div>
          {notifList}
        </div>
      )}
    </div>
  );
}
