import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getChatRoom, getChatMessages } from '@/services/chatService';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import type { Ticket } from '@/domain/ticket';
import type { ChatMessage } from '@/domain/chat';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function formatMsgTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function formatDayLabel(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86_400_000);
  if (diff === 0) return `Today · ${date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;
  if (diff === 1) return 'Yesterday';
  return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTicks({ status }: { status: ChatMessage['status'] }) {
  const glyph = status === 'SENT' ? '✓' : '✓✓';
  const label = status === 'SENT' ? 'Sent' : status === 'DELIVERED' ? 'Delivered' : 'Read';
  return (
    <span className="bubble-status" title={label}>
      <span className={`ticks ${status.toLowerCase()}`}>{glyph}</span>
    </span>
  );
}

function MessageBubble({
  msg,
  isMine,
  senderName,
}: {
  msg: ChatMessage;
  isMine: boolean;
  senderName: string;
}) {
  if (msg.type === 'SYSTEM') {
    return <div className="sys-msg"><span>{msg.content}</span></div>;
  }
  return (
    <div className={`msg-row${isMine ? ' mine' : ''}`}>
      <div
        className="avatar"
        style={{
          width: 30,
          height: 30,
          fontSize: 11,
          background: isMine ? 'var(--navy-700)' : 'var(--navy-900)',
          color: isMine ? '#fff' : 'var(--amber-500)',
        }}
      >
        {getInitials(senderName)}
      </div>
      <div>
        <div className="bubble">{msg.content}</div>
        <div className="bubble-meta">
          {isMine ? 'You' : senderName} · {formatMsgTime(msg.timestamp)}
          {isMine && <> · <StatusTicks status={msg.status} /></>}
        </div>
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { name: string }) {
  return (
    <div className="typing-indicator">
      <span className="typing-dots"><span /><span /><span /></span>
      {name} is typing
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TicketChatPanel({ ticket }: { ticket: Ticket }) {
  const { accessToken, refreshSession } = useAuth();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? '';
  const currentUserName = currentUserQuery.data
    ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
    : 'You';

  const chatRoomId = ticket.chatRoomId ?? null;
  const providerName = ticket.assignedServiceProviderName;
  const providerPic = ticket.assignedServiceProviderProfilePictureUrl ?? null;

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const ackedRef = useRef<Set<number>>(new Set());

  // Resolve the other participant's ID from the room
  const roomQuery = useQuery({
    queryKey: ['chatRoom', chatRoomId],
    queryFn: () => getChatRoom(chatRoomId!, accessToken),
    enabled: Boolean(chatRoomId && accessToken),
  });

  const otherParticipantId = useMemo(() => {
    if (!roomQuery.data || !currentUserId) return null;
    return roomQuery.data.customerId === currentUserId
      ? roomQuery.data.providerId
      : roomQuery.data.customerId;
  }, [roomQuery.data, currentUserId]);

  // Fetch message history
  const messagesQuery = useQuery({
    queryKey: ['chatMessages', chatRoomId],
    queryFn: () => getChatMessages(chatRoomId!, accessToken),
    enabled: Boolean(chatRoomId && accessToken),
  });

  // Only seed from REST on the first successful load; subsequent refetches from
  // React Query must not overwrite real-time messages that arrived via WebSocket.
  const seededRef = useRef(false);
  useEffect(() => {
    if (messagesQuery.data && !seededRef.current) {
      seededRef.current = true;
      setMessages([...messagesQuery.data].reverse());
    }
  }, [messagesQuery.data]);

  // WebSocket handlers
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === incoming.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      }
      return [...prev, incoming];
    });
  }, []);

  const handleStatusUpdate = useCallback((incoming: ChatMessage) => {
    setMessages(prev =>
      prev.map(m =>
        m.id === incoming.id
          ? { ...m, status: incoming.status, deliveredAt: incoming.deliveredAt, readAt: incoming.readAt }
          : m,
      ),
    );
  }, []);

  const handleTypingEvent = useCallback(
    (event: { userId: string; typing: boolean }) => {
      if (event.userId === currentUserId) return;
      setIsOtherTyping(event.typing);
      if (event.typing) {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 4000);
      }
    },
    [currentUserId],
  );

  const { sendMessage, sendTyping, sendStatus, connected: wsConnected } = useChatWebSocket({
    chatRoomId,
    accessToken,
    onMessage: upsertMessage,
    onTyping: handleTypingEvent,
    onStatusUpdate: handleStatusUpdate,
    refreshSession,
  });

  // Auto-acknowledge incoming messages as READ when the chat is open
  useEffect(() => {
    if (!wsConnected || !currentUserId || !chatRoomId) return;
    for (const msg of messages) {
      if (msg.senderId === currentUserId) continue;
      if (msg.recipientId !== currentUserId) continue;
      if (msg.status === 'READ') continue;
      if (ackedRef.current.has(msg.id)) continue;
      ackedRef.current.add(msg.id);
      sendStatus({ messageId: msg.id, chatRoomId, userId: currentUserId, status: 'READ' });
    }
  }, [messages, wsConnected, currentUserId, chatRoomId, sendStatus]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, isOtherTyping]);

  // Group messages by day
  const messageGroups = useMemo(() => {
    const groups: Array<{ dayLabel: string; messages: ChatMessage[] }> = [];
    let currentDay = '';
    for (const msg of messages) {
      const day = new Date(msg.timestamp).toLocaleDateString('en-US');
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ dayLabel: formatDayLabel(msg.timestamp), messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages]);

  const handleSend = () => {
    const content = text.trim();
    setSendError(null);
    if (!content || !chatRoomId || !currentUserId || !otherParticipantId || !wsConnected) return;
    const result = sendMessage({
      senderId: currentUserId,
      recipientId: otherParticipantId,
      chatRoomId,
      content,
      type: 'TEXT',
    });
    if (!result.ok) { setSendError(`Send failed: ${result.reason}`); return; }
    setText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping({ chatRoomId, userId: currentUserId, typing: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!chatRoomId || !currentUserId) return;
    sendTyping({ chatRoomId, userId: currentUserId, typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ chatRoomId: chatRoomId!, userId: currentUserId, typing: false });
    }, 2500);
  };

  const canSend = wsConnected && text.trim().length > 0 && Boolean(otherParticipantId);

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        position: 'sticky',
        top: 90,
        background: 'var(--card)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - 110px)',
        maxHeight: 680,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 18px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div
          className="avatar"
          style={{
            width: 40,
            height: 40,
            fontSize: 14,
            background: providerName ? 'var(--navy-900)' : 'var(--slate-200)',
            color: providerName ? 'var(--amber-500)' : 'var(--slate-500)',
            ...(providerPic ? { padding: 0, overflow: 'hidden' } : {}),
          }}
        >
          {providerPic ? (
            <img
              src={providerPic}
              alt={providerName ?? 'Provider'}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            providerName ? getInitials(providerName) : '?'
          )}
        </div>
        <div>
          <div className="row gap-8" style={{ gap: 8 }}>
            <b style={{ fontSize: 14, letterSpacing: '-0.01em' }}>
              {providerName ?? 'No provider yet'}
            </b>
            {providerName && wsConnected && (
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--emerald-600)' }} />
            )}
          </div>
          <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {providerName ? 'Provider · Chat' : 'Awaiting assignment'}
          </div>
        </div>
        <span className="grow" />
        <span
          className="mono"
          style={{
            fontSize: 10.5,
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            color: wsConnected ? 'var(--emerald-700)' : 'var(--text-muted)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: 5,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 3,
              background: wsConnected ? 'var(--emerald-600)' : 'var(--slate-400)',
            }}
          />
          {chatRoomId ? (wsConnected ? 'Live' : 'Connecting…') : 'No chat'}
        </span>
      </div>

      {/* Messages */}
      <div
        ref={threadRef}
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* No provider / no room */}
        {!chatRoomId && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              color: 'var(--text-muted)',
              gap: 8,
              padding: '24px 16px',
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                background: 'var(--slate-100)',
                display: 'grid',
                placeItems: 'center',
                fontSize: 22,
                marginBottom: 4,
              }}
            >
              💬
            </div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>No chat yet</div>
            <div style={{ fontSize: 13 }}>Messaging will be available once a provider is assigned.</div>
          </div>
        )}

        {/* Loading */}
        {chatRoomId && messagesQuery.isLoading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 'auto' }}>
            Loading messages…
          </div>
        )}

        {/* Empty */}
        {chatRoomId && !messagesQuery.isLoading && messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 'auto' }}>
            No messages yet — say hello!
          </div>
        )}

        {/* Message groups */}
        {messageGroups.map((group, gi) => (
          <div key={gi} style={{ display: 'contents' }}>
            <div className="day-sep"><span>{group.dayLabel}</span></div>
            {group.messages.map(msg => (
              <MessageBubble
                key={msg.id}
                msg={msg}
                isMine={msg.senderId === currentUserId}
                senderName={msg.senderId === currentUserId ? currentUserName : (providerName ?? 'Provider')}
              />
            ))}
          </div>
        ))}

        {isOtherTyping && providerName && <TypingIndicator name={providerName} />}
      </div>

      {/* Compose */}
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '10px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          opacity: chatRoomId ? 1 : 0.4,
          pointerEvents: chatRoomId ? 'auto' : 'none',
        }}
      >
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            placeholder={
              !chatRoomId
                ? 'Messaging unavailable — no provider yet'
                : !wsConnected
                ? 'Connecting…'
                : 'Type a message… (Enter to send)'
            }
            rows={2}
            value={text}
            onChange={e => handleTextChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!chatRoomId || !wsConnected}
            style={{
              flex: 1,
              resize: 'none',
              borderRadius: 10,
              border: '1px solid var(--border)',
              background: 'var(--slate-50)',
              padding: '9px 12px',
              fontSize: 14,
              lineHeight: 1.45,
              fontFamily: 'inherit',
              color: 'var(--text)',
              outline: 'none',
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleSend}
            disabled={!canSend}
            style={{ flexShrink: 0 }}
          >
            Send
          </button>
        </div>
        {sendError && (
          <div style={{ fontSize: 12, color: '#B91C1C', background: '#FEE2E2', padding: '5px 9px', borderRadius: 6 }}>
            {sendError}
          </div>
        )}
      </div>
    </div>
  );
}
