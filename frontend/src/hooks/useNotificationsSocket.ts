import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { isTokenExpired } from '@/lib/jwt';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications';
import { playNotificationSound } from '@/lib/notificationSound';
import type { AppNotification } from '@/domain/notification';

const TOKEN_REFRESH_THRESHOLD_MS = 60_000;

/**
 * Show a native OS notification (which plays the platform's system sound on
 * macOS / Windows / Android / iOS). No-ops when the API is unavailable or the
 * user hasn't granted permission. The `tag` makes the OS replace a same-id
 * notification instead of stacking duplicates.
 */
function showNativeNotification(n: AppNotification) {
  if (typeof Notification === 'undefined') return;
  if (Notification.permission !== 'granted') return;
  // Don't pop a toast for things the user has already read (e.g. a read-clear frame).
  if (n.read) return;
  try {
    new Notification(n.title, {
      body: n.body ?? undefined,
      tag: `fixitnow-notif-${n.id}`,
      icon: '/icons/icon-192.png',
    });
  } catch { /* some browsers block construction off the main gesture — ignore */ }
}

/** Track the highest notification id we've already chimed for, so we only play
 *  the sound for genuinely new notifications (not read-clears or re-deliveries). */
let lastChimedId = 0;

interface UseNotificationsSocketOptions {
  userId: string | null;
  accessToken: string;
  refreshSession: () => Promise<string | null>;
}

/**
 * Subscribes to the current user's notification topic. Any inbound frame
 * (new notification, bumped message group, or read-clear) refetches the
 * notifications list so the navbar badge + dropdown stay in sync live.
 */
export function useNotificationsSocket({ userId, accessToken, refreshSession }: UseNotificationsSocketOptions) {
  const queryClient = useQueryClient();
  const refreshRef = useRef(refreshSession);
  useEffect(() => { refreshRef.current = refreshSession; }, [refreshSession]);

  useEffect(() => {
    if (!userId || !accessToken) return;

    // Ask for OS-notification permission once (so new notifications can play
    // the native system sound). Safe to call repeatedly — it's a no-op once
    // the user has answered.
    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => { /* user dismissed — fine */ });
    }

    // Refresh a near-expired token before connecting (mirrors the chat socket).
    if (isTokenExpired(accessToken, TOKEN_REFRESH_THRESHOLD_MS)) {
      refreshRef.current();
      return;
    }

    const client = new Client({
      webSocketFactory: () => new SockJS(`${env.apiBaseUrl}/ws`) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        client.subscribe(`/topic/notifications/${userId}`, (frame) => {
          try {
            const n = JSON.parse(frame.body) as AppNotification;
            // Upsert the pushed payload straight into the cache instead of refetching.
            // The frame is the authoritative saved row, so this updates the badge/list
            // instantly and avoids racing the server's transaction commit (a refetch can
            // otherwise run before the new row is committed and miss it, leaving the badge
            // stuck at the old count). Upsert by id: replace an existing entry (e.g. a
            // bumped message group or a read-clear), otherwise prepend the new one.
            queryClient.setQueryData<AppNotification[]>(NOTIFICATIONS_QUERY_KEY, (old) => {
              const list = old ?? [];
              const idx = list.findIndex((x) => x.id === n.id);
              if (idx >= 0) {
                const copy = [...list];
                copy[idx] = n;
                return copy;
              }
              return [n, ...list];
            });
            if (n.type === 'TICKET_STATUS_CHANGE' && n.ticketId != null) {
              queryClient.invalidateQueries({ queryKey: ['tickets', n.ticketId] });
            } else if (n.type === 'NEW_MESSAGE' && n.chatRoomId != null) {
              queryClient.invalidateQueries({ queryKey: ['chatMessages', n.chatRoomId] });
              queryClient.invalidateQueries({ queryKey: ['chatRoomsList'] });
            }
            // Fire a native OS notification (plays the system sound when the tab
            // is backgrounded). The `tag` de-dupes repeated deliveries.
            showNativeNotification(n);
            // Also play an in-page chime — audible even when the tab is focused,
            // which the OS notification sound is not. Only for genuinely new,
            // unread notifications (ignore read-clears / re-deliveries of old ids).
            if (!n.read && n.id > lastChimedId) {
              lastChimedId = n.id;
              playNotificationSound();
            }
          } catch { /* ignore malformed frames */ }
        });
      },
      onStompError: (frame) => {
        const msg = frame.headers['message'] ?? '';
        if (/jwt|auth|access denied/i.test(msg)) {
          // Stop the auto-reconnect loop — otherwise the client keeps retrying every
          // `reconnectDelay` ms with the same rejected token, flooding the server logs.
          // A successful refresh updates `accessToken`, which re-runs this effect and
          // creates a fresh client that connects with the new token.
          client.deactivate();
          refreshRef.current().catch(() => { /* already logged inside */ });
        }
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [userId, accessToken, queryClient]);
}
