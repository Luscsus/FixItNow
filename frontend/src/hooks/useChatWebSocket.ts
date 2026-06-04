import { useEffect, useRef, useCallback, useState } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type {
  ChatError,
  ChatMessage,
  ChatTypingEvent,
  DeleteMessagePayload,
  EditMessagePayload,
  SendMessagePayload,
  SendStatusPayload,
} from '@/domain/chat';
import { env } from '@/config/env';
import { isTokenExpired } from '@/lib/jwt';

interface UseChatWebSocketOptions {
  chatRoomId: string | null;
  accessToken: string;
  onMessage: (msg: ChatMessage) => void;
  onTyping: (event: ChatTypingEvent) => void;
  onStatusUpdate: (msg: ChatMessage) => void;
  /** Called when the server rejects a message (rate limit / anti-spam). */
  onError?: (err: ChatError) => void;
  /** Refresh the access token. Returns the new token or null on failure. */
  refreshSession: () => Promise<string | null>;
}

// If the access token expires within this window, refresh it BEFORE opening
// the WebSocket — avoids the "CONNECT rejected → 5s reconnect loop" pattern
// you get when the JWT goes stale mid-session.
const TOKEN_REFRESH_THRESHOLD_MS = 60_000;

export function useChatWebSocket({
  chatRoomId,
  accessToken,
  onMessage,
  onTyping,
  onStatusUpdate,
  onError,
  refreshSession,
}: UseChatWebSocketOptions) {
  const clientRef = useRef<Client | null>(null);
  const onMessageRef = useRef(onMessage);
  const onTypingRef = useRef(onTyping);
  const onStatusUpdateRef = useRef(onStatusUpdate);
  const onErrorRef = useRef(onError);
  const refreshSessionRef = useRef(refreshSession);
  const [connected, setConnected] = useState(false);

  useEffect(() => { onMessageRef.current = onMessage; }, [onMessage]);
  useEffect(() => { onTypingRef.current = onTyping; }, [onTyping]);
  useEffect(() => { onStatusUpdateRef.current = onStatusUpdate; }, [onStatusUpdate]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { refreshSessionRef.current = refreshSession; }, [refreshSession]);

  useEffect(() => {
    if (!chatRoomId || !accessToken) return;

    // Proactive refresh: if the token is already (near-)expired, request a
    // refresh and let the effect re-run with the new token. This prevents
    // opening the WS with a stale token and getting stuck in a 2s reconnect
    // loop while the server rejects every CONNECT.
    if (isTokenExpired(accessToken, TOKEN_REFRESH_THRESHOLD_MS)) {
      console.log('[chat-ws] token expired/expiring soon, refreshing before connect');
      refreshSessionRef.current();
      return;
    }

    const sockJsUrl = `${env.apiBaseUrl}/ws`;
    console.log('[chat-ws] connecting via SockJS to', sockJsUrl, 'for room', chatRoomId);

    const client = new Client({
      webSocketFactory: () => new SockJS(sockJsUrl) as unknown as WebSocket,
      connectHeaders: { Authorization: `Bearer ${accessToken}` },
      // Faster reconnect on drop (was 5s)
      reconnectDelay: 2000,
      // Heartbeats let us detect a dead connection within ~10s instead of waiting
      // for the next send to fail. Server WebSocketConfig already supports this.
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      debug: (msg) => console.log('[stomp]', msg),
      onConnect: () => {
        console.log('[chat-ws] CONNECTED to room', chatRoomId);
        setConnected(true);
        client.subscribe(`/topic/chat/${chatRoomId}`, (frame) => {
          try {
            const msg = JSON.parse(frame.body) as ChatMessage;
            onMessageRef.current(msg);
          } catch (err) { console.error('[chat-ws] msg parse failed', err); }
        });
        client.subscribe(`/topic/chat/${chatRoomId}/typing`, (frame) => {
          try { onTypingRef.current(JSON.parse(frame.body) as ChatTypingEvent); }
          catch { /* ignore */ }
        });
        client.subscribe(`/topic/chat/${chatRoomId}/status`, (frame) => {
          try { onStatusUpdateRef.current(JSON.parse(frame.body) as ChatMessage); }
          catch { /* ignore */ }
        });
        // Per-user error queue — rate-limit / anti-spam rejections land here.
        client.subscribe('/user/queue/errors', (frame) => {
          try { onErrorRef.current?.(JSON.parse(frame.body) as ChatError); }
          catch { /* ignore */ }
        });
      },
      onDisconnect: () => { setConnected(false); },
      onStompError: (frame) => {
        const msg = frame.headers['message'] ?? '';
        console.error('[chat-ws] STOMP error:', msg, frame.body);
        setConnected(false);
        // If the server says auth failed, try refreshing the token. The state
        // update in refreshSession will make this effect re-run with a new
        // accessToken and the next CONNECT will succeed.
        if (/jwt|auth|access denied/i.test(msg)) {
          // Stop the auto-reconnect loop so we don't keep retrying with the same
          // rejected token. A successful refresh updates accessToken, re-running
          // this effect with a fresh client.
          client.deactivate();
          refreshSessionRef.current().catch(() => { /* already logged inside */ });
        }
      },
      onWebSocketError: (evt) => { console.error('[chat-ws] WebSocket error', evt); setConnected(false); },
      onWebSocketClose: (evt) => { console.warn('[chat-ws] WebSocket closed', evt.code, evt.reason); setConnected(false); },
    });

    client.activate();
    clientRef.current = client;

    return () => {
      client.deactivate();
      clientRef.current = null;
      setConnected(false);
    };
  }, [chatRoomId, accessToken]);

  const sendMessage = useCallback((payload: SendMessagePayload): { ok: boolean; reason?: string } => {
    const client = clientRef.current;
    if (!client) return { ok: false, reason: 'no client' };
    if (!client.connected) return { ok: false, reason: 'not connected' };
    try {
      client.publish({ destination: '/app/chat.send', body: JSON.stringify(payload) });
      return { ok: true };
    } catch (err) {
      console.error('[chat-ws] publish failed', err);
      return { ok: false, reason: String(err) };
    }
  }, []);

  const sendEdit = useCallback((payload: EditMessagePayload) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try { client.publish({ destination: '/app/chat.edit', body: JSON.stringify(payload) }); }
    catch (err) { console.error('[chat-ws] edit failed', err); }
  }, []);

  const sendDelete = useCallback((payload: DeleteMessagePayload) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try { client.publish({ destination: '/app/chat.delete', body: JSON.stringify(payload) }); }
    catch (err) { console.error('[chat-ws] delete failed', err); }
  }, []);

  const sendTyping = useCallback((payload: ChatTypingEvent) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try { client.publish({ destination: '/app/chat.typing', body: JSON.stringify(payload) }); }
    catch { /* ignore */ }
  }, []);

  const sendStatus = useCallback((payload: SendStatusPayload) => {
    const client = clientRef.current;
    if (!client?.connected) return;
    try { client.publish({ destination: '/app/chat.status', body: JSON.stringify(payload) }); }
    catch (err) { console.error('[chat-ws] status send failed', err); }
  }, []);

  return { sendMessage, sendTyping, sendStatus, sendEdit, sendDelete, connected };
}
