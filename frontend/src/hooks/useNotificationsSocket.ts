import { useEffect, useRef } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { useQueryClient } from '@tanstack/react-query';
import { env } from '@/config/env';
import { isTokenExpired } from '@/lib/jwt';
import { NOTIFICATIONS_QUERY_KEY } from '@/hooks/useNotifications';
import type { AppNotification } from '@/domain/notification';

const TOKEN_REFRESH_THRESHOLD_MS = 60_000;

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
          queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
          try {
            const n = JSON.parse(frame.body) as AppNotification;
            if (n.type === 'TICKET_STATUS_CHANGE' && n.ticketId != null) {
              queryClient.invalidateQueries({ queryKey: ['tickets', n.ticketId] });
            } else if (n.type === 'NEW_MESSAGE' && n.chatRoomId != null) {
              queryClient.invalidateQueries({ queryKey: ['chatMessages', n.chatRoomId] });
              queryClient.invalidateQueries({ queryKey: ['chatRoomsList'] });
            }
          } catch { /* ignore malformed frames */ }
        });
      },
      onStompError: (frame) => {
        const msg = frame.headers['message'] ?? '';
        if (/jwt|auth|access denied/i.test(msg)) {
          refreshRef.current().catch(() => { /* already logged inside */ });
        }
      },
    });

    client.activate();
    return () => { client.deactivate(); };
  }, [userId, accessToken, queryClient]);
}
