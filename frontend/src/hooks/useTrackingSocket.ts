import { useEffect, useRef, useState, useCallback } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";
import { env } from "@/config/env";
import { isTokenExpired } from "@/lib/jwt";
import type { ProviderLocationUpdate, TrackingSnapshot } from "@/domain/tracking";

const TOKEN_REFRESH_THRESHOLD_MS = 60_000;

interface UseTrackingSocketOptions {
  /** Ticket to track. Null disables the socket. */
  ticketId: number | null;
  accessToken: string;
  /** Called with each snapshot relayed from the server. */
  onSnapshot: (snapshot: TrackingSnapshot) => void;
  refreshSession: () => Promise<string | null>;
}

/**
 * Live-tracking STOMP socket for a single ticket. Mirrors useChatWebSocket:
 * proactive token refresh, SockJS transport, auto-reconnect, heartbeats.
 *
 * - Customer side: read snapshots via `onSnapshot`.
 * - Provider side: call `publishLocation(...)` to broadcast GPS coords. The
 *   server relays the computed snapshot back on the same topic, so providers
 *   also receive their own ETA/distance via `onSnapshot`.
 */
export function useTrackingSocket({
  ticketId,
  accessToken,
  onSnapshot,
  refreshSession,
}: UseTrackingSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const onSnapshotRef = useRef(onSnapshot);
  const refreshSessionRef = useRef(refreshSession);
  const [connected, setConnected] = useState(false);

  useEffect(() => { onSnapshotRef.current = onSnapshot; }, [onSnapshot]);
  useEffect(() => { refreshSessionRef.current = refreshSession; }, [refreshSession]);

  useEffect(() => {
    if (!ticketId || !accessToken) return;

    if (isTokenExpired(accessToken, TOKEN_REFRESH_THRESHOLD_MS)) {
      refreshSessionRef.current();
      return;
    }

    const sockJsUrl = `${env.apiBaseUrl}/ws`;
    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      reconnectDelay: 2000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      onConnect: () => {
        setConnected(true);
        client.subscribe(`/topic/tracking/${ticketId}`, (frame) => {
          try {
            onSnapshotRef.current(JSON.parse(frame.body) as TrackingSnapshot);
          } catch (err) {
            console.error("[tracking-ws] snapshot parse failed", err);
          }
        });
      },
      onDisconnect: () => setConnected(false),
      onStompError: (frame) => {
        const msg = frame.headers["message"] ?? "";
        setConnected(false);
        if (/jwt|auth|access denied/i.test(msg)) {
          refreshSessionRef.current().catch(() => { /* logged inside */ });
        }
      },
      onWebSocketError: () => setConnected(false),
      onWebSocketClose: () => setConnected(false),
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [ticketId, accessToken]);

  const publishLocation = useCallback((update: ProviderLocationUpdate): boolean => {
    const client = clientRef.current;
    if (!client?.connected) return false;
    try {
      client.publish({
        destination: "/app/tracking.update",
        body: JSON.stringify(update),
      });
      return true;
    } catch (err) {
      console.error("[tracking-ws] publish failed", err);
      return false;
    }
  }, []);

  return { connected, publishLocation };
}
