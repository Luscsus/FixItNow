import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/context/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { listTickets, listProviderTickets } from '@/services/ticketService';
import { getChatRoom, getChatRooms, getChatMessages } from '@/services/chatService';
import { getProvider } from '@/services/providerService';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import type { Ticket, TicketPriority, TicketStatus } from '@/domain/ticket';
import type { ChatMessage, MessageStatus } from '@/domain/chat';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatInboxTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString('en-US', { weekday: 'short' });
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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

function formatMsgTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function priorityToUrgency(priority: string): string {
  const map: Record<string, string> = {
    LOW: 'urgency-low', MEDIUM: 'urgency-medium', HIGH: 'urgency-high', CRITICAL: 'urgency-critical',
  };
  return map[priority] ?? 'urgency-low';
}

// Format ticket id as "FIX-2418" — matches the design across the rest of the app.
function formatTicketId(id: number | null): string {
  if (id === null) return '';
  return `FIX-${id.toString().padStart(4, '0')}`;
}

// Map ticket lifecycle status to the phase shown on the right of the context bar.
type Phase = { num: string; label: string; tone: 'idle' | 'live' | 'done' };
function statusToPhase(status: TicketStatus | null): Phase {
  if (!status) return { num: '—', label: '—', tone: 'idle' };
  const map: Record<TicketStatus, Phase> = {
    PENDING_APPROVAL:         { num: '01', label: 'Awaiting approval', tone: 'idle' },
    DECLINED:                 { num: '—',  label: 'Declined',          tone: 'idle' },
    APPROVED:                 { num: '02', label: 'Scheduled',         tone: 'live' },
    IN_TRANSIT:               { num: '03', label: 'On site',           tone: 'live' },
    PENDING_PROVIDER_INVOICE: { num: '04', label: 'Awaiting invoice',  tone: 'live' },
    PENDING_PAYMENT:          { num: '04', label: 'Awaiting payment',  tone: 'live' },
    COMPLETED:                { num: '05', label: 'Complete',          tone: 'done' },
    CANCELLED:                { num: '—',  label: 'Cancelled',         tone: 'idle' },
  };
  return map[status];
}

// Friendly version of the priority enum for display.
function priorityLabel(p: TicketPriority): string {
  return p.charAt(0) + p.slice(1).toLowerCase();
}

// ─── Status checkmarks ──────────────────────────────────────────────────────
// ✓   = SENT       (delivered to server)
// ✓✓  = DELIVERED  (the recipient's client received it)
// ✓✓  = READ       (recipient actually opened the chat) — same glyph, blue color

function StatusTicks({ status }: { status: MessageStatus }) {
  const cls = status.toLowerCase();
  const glyph = status === 'SENT' ? '✓' : '✓✓';
  const label = status === 'SENT' ? 'Sent' : status === 'DELIVERED' ? 'Delivered' : 'Read';
  return (
    <span className="bubble-status" title={label}>
      <span className={`ticks ${cls}`}>{glyph}</span>
    </span>
  );
}

// A conversation represents a chat room. It MAY have associated ticket data
// (when our tickets query returns a ticket linked to that room). When the ticket
// data is missing, we still surface the conversation with a minimal fallback so
// no chat ever silently disappears from the inbox.
type Conversation = {
  roomId: string;
  ticketId: number | null;
  description: string;
  status: TicketStatus | null;
  priority: TicketPriority;
  otherName: string;
};

const QUICK_REPLIES = ['👍 Sounds good', 'Thanks!', 'On my way', 'Can you send a photo?'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function InboxRow({ conv, selected, lastMsg, hasUnread, onSelect }: {
  conv: Conversation;
  selected: boolean;
  lastMsg: ChatMessage | null;
  hasUnread: boolean;
  onSelect: () => void;
}) {
  return (
    <div className={`inbox-row${selected ? ' selected' : ''}`} onClick={onSelect}>
      <div className="avatar" style={{ width: 36, height: 36, fontSize: 11, background: 'var(--navy-900)', color: 'var(--amber-500)' }}>
        {getInitials(conv.otherName)}
      </div>
      <div style={{ minWidth: 0 }}>
        <div className="inbox-name">
          {conv.otherName}
          {conv.ticketId !== null && <span className="ticket-id">· {formatTicketId(conv.ticketId)}</span>}
        </div>
        <div
          className="inbox-preview"
          style={hasUnread ? { color: 'var(--text)', fontWeight: 500 } : undefined}
        >
          {lastMsg ? lastMsg.content : conv.description}
        </div>
      </div>
      <div className="inbox-time-col">
        {lastMsg && <div className="inbox-time">{formatInboxTime(lastMsg.timestamp)}</div>}
        {hasUnread && <span className="unread-dot" />}
      </div>
    </div>
  );
}

function MessageBubble({ msg, isMine, senderName }: { msg: ChatMessage; isMine: boolean; senderName: string }) {
  if (msg.type === 'SYSTEM') {
    return <div className="sys-msg"><span>{msg.content}</span></div>;
  }
  return (
    <div className={`msg-row${isMine ? ' mine' : ''}`}>
      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, background: isMine ? 'var(--navy-700)' : 'var(--navy-900)', color: isMine ? '#fff' : 'var(--amber-500)' }}>
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

// ─── Main component ──────────────────────────────────────────────────────────

export function ChatPage() {
  const { accessToken, role, refreshSession } = useAuth();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? '';
  const currentUserName = currentUserQuery.data
    ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
    : 'You';

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(searchParams.get('room'));

  // Single merged message state — easier to update statuses in-place
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'unread'>('all');
  const [sendError, setSendError] = useState<string | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  // Track which incoming messages we've already marked as DELIVERED/READ to avoid spam
  const ackedRef = useRef<Set<number>>(new Set());
  // Prevent React Query focus-refetches from overwriting real-time WS messages
  const seededRoomRef = useRef<string | null>(null);

  const isProvider = role === 'PROVIDER';

  // Load tickets (role-specific) for display info
  const ticketsQuery = useQuery({
    queryKey: ['chatInboxTickets', isProvider],
    queryFn: () => (isProvider ? listProviderTickets(accessToken) : listTickets(accessToken)),
    enabled: Boolean(accessToken),
  });

  // Unread = messages from the other person in the SELECTED room not yet READ.
  // We only know this for the currently-loaded room (we don't load all rooms' messages).
  const hasUnreadInSelectedRoom = useMemo(() => {
    if (!selectedRoomId || !currentUserId) return false;
    return messages.some(m => m.senderId !== currentUserId && m.status !== 'READ');
  }, [messages, selectedRoomId, currentUserId]);

  // Source of truth for inbox: ALL chat rooms this user participates in.
  // This catches rooms whose ticket data isn't in our tickets query
  // (e.g. older tickets, edge cases where chatRoomId isn't populated).
  const roomsQuery = useQuery({
    queryKey: ['chatRoomsList'],
    queryFn: () => getChatRooms(accessToken),
    enabled: Boolean(accessToken),
  });

  // Chat room details (to resolve the other participant's UUID)
  const roomQuery = useQuery({
    queryKey: ['chatRoom', selectedRoomId],
    queryFn: () => getChatRoom(selectedRoomId!, accessToken),
    enabled: Boolean(selectedRoomId && accessToken),
  });

  const otherParticipantId = useMemo(() => {
    if (!roomQuery.data || !currentUserId) return null;
    return roomQuery.data.customerId === currentUserId
      ? roomQuery.data.providerId
      : roomQuery.data.customerId;
  }, [roomQuery.data, currentUserId]);

  // Fetch the other party's provider profile when current user is the customer.
  // (We only have a provider-details endpoint, not a generic user-by-id one.)
  const otherIsProvider = roomQuery.data ? roomQuery.data.providerId === otherParticipantId : false;
  const providerProfileQuery = useQuery({
    queryKey: ['providerProfile', otherParticipantId],
    queryFn: () => getProvider(otherParticipantId!, accessToken),
    enabled: Boolean(otherParticipantId && accessToken && otherIsProvider),
    staleTime: 5 * 60 * 1000,
  });

  // Message history (REST)
  const messagesQuery = useQuery({
    queryKey: ['chatMessages', selectedRoomId],
    queryFn: () => getChatMessages(selectedRoomId!, accessToken),
    enabled: Boolean(selectedRoomId && accessToken),
  });

  useEffect(() => {
    // When switching rooms, clear immediately so the previous room's messages
    // don't flash. When data arrives for a new room, seed once and then let
    // real-time WS updates take over — subsequent React Query refetches (e.g.
    // window focus) must not overwrite messages that arrived via WebSocket.
    if (!selectedRoomId) { setMessages([]); return; }
    if (!messagesQuery.data) { setMessages([]); return; }
    if (seededRoomRef.current === selectedRoomId) return;
    seededRoomRef.current = selectedRoomId;
    setMessages([...messagesQuery.data].reverse());
  }, [messagesQuery.data, selectedRoomId]);

  // Reset acked set when switching rooms
  useEffect(() => {
    ackedRef.current.clear();
  }, [selectedRoomId]);

  // WebSocket handlers
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    setMessages(prev => {
      const idx = prev.findIndex(m => m.id === incoming.id);
      if (idx >= 0) {
        // Already have it — merge (in case status changed)
        const next = [...prev];
        next[idx] = { ...next[idx], ...incoming };
        return next;
      }
      // New message — append in chronological order
      return [...prev, incoming];
    });
  }, []);

  const handleStatusUpdate = useCallback((incoming: ChatMessage) => {
    setMessages(prev => prev.map(m =>
      m.id === incoming.id ? { ...m, status: incoming.status, deliveredAt: incoming.deliveredAt, readAt: incoming.readAt } : m,
    ));
  }, []);

  const handleTypingEvent = useCallback((event: { userId: string; typing: boolean }) => {
    if (event.userId === currentUserId) return;
    setIsOtherTyping(event.typing);
    if (event.typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 4000);
    }
  }, [currentUserId]);

  const { sendMessage, sendTyping, sendStatus, connected: wsConnected } = useChatWebSocket({
    chatRoomId: selectedRoomId,
    accessToken,
    onMessage: upsertMessage,
    onTyping: handleTypingEvent,
    onStatusUpdate: handleStatusUpdate,
    refreshSession,
  });

  // ── Auto-acknowledge: send DELIVERED, then READ for messages from the other person
  useEffect(() => {
    if (!wsConnected || !currentUserId || !selectedRoomId) return;
    for (const msg of messages) {
      if (msg.senderId === currentUserId) continue;          // skip own
      if (msg.recipientId !== currentUserId) continue;        // not for me
      if (msg.status === 'READ') continue;                    // already read
      if (ackedRef.current.has(msg.id)) continue;             // already acked
      ackedRef.current.add(msg.id);
      // Since the conversation is open, jump straight to READ.
      sendStatus({
        messageId: msg.id,
        chatRoomId: selectedRoomId,
        userId: currentUserId,
        status: 'READ',
      });
    }
  }, [messages, wsConnected, currentUserId, selectedRoomId, sendStatus]);

  // Build inbox: iterate ALL rooms from /api/chat/rooms, enrich each with ticket
  // data when present. This way no conversation ever silently disappears.
  const conversations: Conversation[] = useMemo(() => {
    const roomIds = roomsQuery.data ?? [];

    // Index tickets by their chatRoomId for O(1) lookup
    const ticketByRoom = new Map<string, Ticket>();
    for (const t of ticketsQuery.data ?? []) {
      if (t.chatRoomId) ticketByRoom.set(t.chatRoomId, t);
    }

    const list: Conversation[] = roomIds.map(roomId => {
      const ticket = ticketByRoom.get(roomId);
      if (ticket) {
        return {
          roomId,
          ticketId: ticket.id,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority,
          otherName: isProvider
            ? (ticket.submittedByName ?? 'Customer')
            : (ticket.assignedServiceProviderName ?? 'Provider'),
        };
      }
      // No ticket match — surface the conversation with a fallback so the user
      // can still open it. Once a message loads we'll know the other party.
      return {
        roomId,
        ticketId: null,
        description: 'Conversation',
        status: null,
        priority: 'LOW',
        otherName: isProvider ? 'Customer' : 'Provider',
      };
    });

    return list
      .filter(c => {
        if (!search) return true;
        const q = search.toLowerCase();
        return c.otherName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q);
      })
      .filter(c => {
        if (tab === 'active') return c.status !== null && ['APPROVED', 'IN_TRANSIT'].includes(c.status);
        if (tab === 'unread') return c.roomId === selectedRoomId && hasUnreadInSelectedRoom;
        return true;
      });
  }, [roomsQuery.data, ticketsQuery.data, isProvider, search, tab, selectedRoomId, hasUnreadInSelectedRoom]);

  const selectedConv = conversations.find(c => c.roomId === selectedRoomId) ?? null;

  // Last message for inbox preview (current room only — keeping it simple)
  const lastMsgForRoom = useMemo(() => {
    if (!selectedRoomId || messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [selectedRoomId, messages]);

  // Auto-scroll the thread to bottom on new messages / typing
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, isOtherTyping]);

  const selectRoom = (roomId: string) => {
    if (roomId === selectedRoomId) return;
    seededRoomRef.current = null;
    setSelectedRoomId(roomId);
    setSearchParams({ room: roomId });
    ackedRef.current.clear();
    setIsOtherTyping(false);
    setText('');
    setSendError(null);
  };

  const handleSend = () => {
    const content = text.trim();
    setSendError(null);
    if (!content) return;
    if (!selectedRoomId) { setSendError('No room selected'); return; }
    if (!currentUserId) { setSendError('Current user not loaded'); return; }
    if (!otherParticipantId) { setSendError('Recipient not resolved'); return; }
    if (!wsConnected) { setSendError('WebSocket not connected'); return; }

    const result = sendMessage({
      senderId: currentUserId,
      recipientId: otherParticipantId,
      chatRoomId: selectedRoomId,
      content,
      type: 'TEXT',
    });
    if (!result.ok) { setSendError(`Send failed: ${result.reason}`); return; }

    setText('');
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping({ chatRoomId: selectedRoomId, userId: currentUserId, typing: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    if (!selectedRoomId || !currentUserId) return;
    sendTyping({ chatRoomId: selectedRoomId, userId: currentUserId, typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ chatRoomId: selectedRoomId!, userId: currentUserId, typing: false });
    }, 2500);
  };

  // Group messages by day for separators
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

  const canSend = text.trim().length > 0;

  return (
    <div className="chat-shell">

      {/* ── Inbox sidebar ── */}
      <aside className="inbox">
        <div className="inbox-head">
          <h2>Inbox</h2>
          <div className="inbox-search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input placeholder="Search messages…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="inbox-tabs">
          <button aria-pressed={tab === 'all'} onClick={() => setTab('all')}>
            All
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: 4 }}>
              {(roomsQuery.data?.length ?? 0).toString().padStart(2, '0')}
            </span>
          </button>
          <button aria-pressed={tab === 'active'} onClick={() => setTab('active')}>Active</button>
          <button aria-pressed={tab === 'unread'} onClick={() => setTab('unread')}>
            Unread {hasUnreadInSelectedRoom && <span className="unread-dot" style={{ marginLeft: 6 }} />}
          </button>
        </div>

        <div className="inbox-list">
          {(ticketsQuery.isLoading || roomsQuery.isLoading) && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>Loading…</div>
          )}
          {!ticketsQuery.isLoading && !roomsQuery.isLoading && conversations.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No conversations yet</div>
          )}
          {conversations.map(conv => (
            <InboxRow
              key={conv.roomId}
              conv={conv}
              selected={conv.roomId === selectedRoomId}
              lastMsg={conv.roomId === selectedRoomId ? lastMsgForRoom : null}
              hasUnread={conv.roomId === selectedRoomId && hasUnreadInSelectedRoom}
              onSelect={() => selectRoom(conv.roomId)}
            />
          ))}
        </div>
      </aside>

      {/* ── Conversation panel ── */}
      {selectedConv ? (
        <section className="conv">
          {/* Header */}
          {(() => {
            const profile = providerProfileQuery.data;
            // Prefer category name as the role label ("Plumbing" → "Plumber-ish"),
            // fall back to a generic role. We display the category verbatim — the
            // backend uses uppercase enums like "PLUMBING" so we title-case it.
            const categoryLabel = profile?.categories?.[0]
              ? profile.categories[0].charAt(0) + profile.categories[0].slice(1).toLowerCase().replace(/_/g, ' ')
              : (isProvider ? 'Customer' : 'Service Provider');
            // Sub-line bits we can actually compute from backend data
            const subBits: string[] = [];
            if (profile?.yearsOfExperience != null) {
              subBits.push(`${profile.yearsOfExperience} yr${profile.yearsOfExperience === 1 ? '' : 's'} experience`);
            }
            if (profile?.pricePerHour != null) {
              subBits.push(`$${profile.pricePerHour}/hr`);
            }
            if (profile?.serviceRadiusKm != null) {
              subBits.push(`${profile.serviceRadiusKm} km radius`);
            }
            const subLine = subBits.length > 0 ? subBits.join(' · ') : null;

            return (
              <div className="conv-head">
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: 'var(--navy-900)', color: 'var(--amber-500)' }}>
                  {getInitials(selectedConv.otherName)}
                </div>
                <div className="conv-name" style={{ minWidth: 0 }}>
                  <h2>
                    {selectedConv.otherName}{' '}
                    <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>
                      · {categoryLabel}
                    </span>
                  </h2>
                  <div className="sub">
                    {/* Presence/rating aren't tracked yet — show only computed bits.
                        TODO: presence service + ratings aggregate. */}
                    {wsConnected && <><span style={{ color: 'var(--emerald-700)' }}>● Online</span>{subLine && ' · '}</>}
                    {subLine}
                  </div>
                </div>
                <span style={{ flex: 1 }} />
                <button className="btn btn-ghost btn-sm" type="button">View profile</button>
                <button className="btn btn-secondary btn-sm" type="button">Mute</button>
              </div>
            );
          })()}

          {/* Ticket context bar — only shown when we have ticket data for this room */}
          {selectedConv.ticketId !== null && (() => {
            const phase = statusToPhase(selectedConv.status);
            return (
              <div className="chat-ctx">
                <span className="chat-ctx-id">{formatTicketId(selectedConv.ticketId)}</span>
                <span className="chat-ctx-title">
                  {selectedConv.description.length > 60
                    ? selectedConv.description.slice(0, 60) + '…'
                    : selectedConv.description}
                </span>
                <span className={`urgency ${priorityToUrgency(selectedConv.priority)}`} style={{ height: 22 }}>
                  {priorityLabel(selectedConv.priority)}
                </span>
                <span style={{ flex: 1 }} />
                <span className={`ctx-phase${phase.tone === 'done' ? ' done' : phase.tone === 'idle' ? ' idle' : ''}`}>
                  <span className="dot" />
                  Phase {phase.num} · {phase.label}
                </span>
                <a href={`/tickets/${selectedConv.ticketId}`} className="btn btn-secondary btn-sm">
                  Open ticket →
                </a>
              </div>
            );
          })()}

          {/* Message thread (scrolls internally) */}
          <div className="conv-thread" ref={threadRef}>
            {messagesQuery.isLoading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>Loading messages…</div>
            )}

            {messageGroups.map((group, gi) => (
              <div key={gi} style={{ display: 'contents' }}>
                <div className="day-sep"><span>{group.dayLabel}</span></div>
                {group.messages.map(msg => (
                  <MessageBubble
                    key={msg.id}
                    msg={msg}
                    isMine={msg.senderId === currentUserId}
                    senderName={msg.senderId === currentUserId ? currentUserName : selectedConv.otherName}
                  />
                ))}
              </div>
            ))}

            {messages.length === 0 && !messagesQuery.isLoading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 'auto' }}>
                No messages yet — say hello!
              </div>
            )}

            {isOtherTyping && <TypingIndicator name={selectedConv.otherName} />}
          </div>

          {/* Composer */}
          <div className="composer">
            <div className="quick-replies">
              {QUICK_REPLIES.map(reply => (
                <button key={reply} className="quick" onClick={() => handleTextChange(text ? `${text} ${reply}` : reply)}>
                  {reply}
                </button>
              ))}
            </div>
            <div className="composer-wrap">
              <textarea
                placeholder="Type a message… (Enter to send, Shift + Enter for newline)"
                rows={2}
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="composer-bottom">
                <button className="icon-btn" type="button" title="Attach file" aria-label="Attach file">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" />
                  </svg>
                </button>
                <button className="icon-btn" type="button" title="Send photo" aria-label="Send photo">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <span className="muted mono" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                  {selectedConv.ticketId !== null
                    ? <>REPLYING TO <span style={{ color: 'var(--text)' }}>{formatTicketId(selectedConv.ticketId)}</span></>
                    : <>REPLYING TO <span style={{ color: 'var(--text)' }}>{selectedConv.otherName}</span></>
                  }
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: wsConnected ? 'var(--emerald-700)' : 'var(--text-muted)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: wsConnected ? 'var(--emerald-600)' : 'var(--slate-400)' }} />
                  {wsConnected ? 'LIVE' : 'CONNECTING…'}
                </span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!canSend}>
                  Send
                  <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                    <path d="M14 8L2 2l3.5 6L2 14l12-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              {sendError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#B91C1C', background: '#FEE2E2', padding: '6px 10px', borderRadius: 6 }}>
                  {sendError}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : (
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Select a conversation</div>
          <div style={{ fontSize: 13 }}>Choose a ticket from the inbox to start chatting</div>
        </div>
      )}
    </div>
  );
}
