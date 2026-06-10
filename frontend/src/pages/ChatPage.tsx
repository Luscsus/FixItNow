import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useSEO } from '@/hooks/useSEO';

import { useAuth } from '@/context/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { listTickets, listProviderTickets } from '@/services/ticketService';
import { getChatRoom, getChatRooms, getChatMessages, deleteChatRoom } from '@/services/chatService';
import { getProvider } from '@/services/providerService';
import { uploadFile as uploadFileToServer } from '@/services/imageService';
import type { ChatRoomSummary } from '@/domain/chat';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import type { Ticket, TicketPriority, TicketStatus } from '@/domain/ticket';
import type { ChatError, ChatMessage, MessageStatus, MessageType } from '@/domain/chat';
import { renderSystemMessage } from '@/utils/systemMessage';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useNotifications } from '@/hooks/useNotifications';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatInboxTime(timestamp: string, locale: string, yesterdayLabel: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const days = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
  if (days === 0) return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
  if (days === 1) return yesterdayLabel;
  if (days < 7) return date.toLocaleDateString(locale, { weekday: 'short' });
  return date.toLocaleDateString(locale, { month: 'short', day: 'numeric' });
}

function formatDayLabel(timestamp: string, locale: string, todayLabel: string, yesterdayLabel: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diff = Math.floor((today.getTime() - msgDay.getTime()) / 86_400_000);
  if (diff === 0) return `${todayLabel} · ${date.toLocaleDateString(locale, { month: 'long', day: 'numeric' })}`;
  if (diff === 1) return yesterdayLabel;
  return date.toLocaleDateString(locale, { weekday: 'long', month: 'long', day: 'numeric' });
}

function formatMsgTime(timestamp: string, locale: string): string {
  return new Date(timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
}

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function priorityToUrgency(priority: string | null): string {
  const map: Record<string, string> = {
    LOW: 'urgency-low', MEDIUM: 'urgency-medium', HIGH: 'urgency-high', CRITICAL: 'urgency-critical',
  };
  return (priority ? map[priority] : undefined) ?? 'urgency-low';
}

// Format ticket id as "FIX-2418" — matches the design across the rest of the app.
function formatTicketId(id: number | null): string {
  if (id === null) return '';
  return `FIX-${id.toString().padStart(4, '0')}`;
}

// Map ticket lifecycle status to the phase shown on the right of the context bar.
type Phase = { num: string; labelKey: string; tone: 'idle' | 'live' | 'done' };
function statusToPhase(status: TicketStatus | null): Phase {
  if (!status) return { num: '—', labelKey: '', tone: 'idle' };
  const map: Record<TicketStatus, Phase> = {
    PENDING_APPROVAL:         { num: '01', labelKey: 'chat.phase_PENDING_APPROVAL',         tone: 'idle' },
    DECLINED:                 { num: '—',  labelKey: 'chat.phase_DECLINED',                  tone: 'idle' },
    APPROVED:                 { num: '02', labelKey: 'chat.phase_APPROVED',                  tone: 'live' },
    IN_TRANSIT:               { num: '03', labelKey: 'chat.phase_IN_TRANSIT',                tone: 'live' },
    PENDING_PROVIDER_INVOICE: { num: '04', labelKey: 'chat.phase_PENDING_PROVIDER_INVOICE',  tone: 'live' },
    PENDING_PAYMENT:          { num: '04', labelKey: 'chat.phase_PENDING_PAYMENT',           tone: 'live' },
    COMPLETED:                { num: '05', labelKey: 'chat.phase_COMPLETED',                 tone: 'done' },
    CANCELLED:                { num: '—',  labelKey: 'chat.phase_CANCELLED',                 tone: 'idle' },
  };
  return map[status];
}

// Friendly version of the priority enum for display.
function priorityLabel(p: TicketPriority | null): string {
  if (!p) return "";
  return p.charAt(0) + p.slice(1).toLowerCase();
}

// ─── Attachment helpers ──────────────────────────────────────────────────────

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB
const ALLOWED_MIME: Record<string, true> = {
  'image/jpeg': true, 'image/jpg': true, 'image/png': true,
  'application/pdf': true,
  'application/msword': true,
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': true,
};

type StagedFile = { localId: string; file: File; objectUrl: string | null };

function validateAttachment(file: File): string | null {
  if (!ALLOWED_MIME[file.type]) return `"${file.name}" — type not allowed (JPEG, PNG, PDF, DOC, DOCX only)`;
  if (file.size > MAX_FILE_BYTES) return `"${file.name}" — exceeds 10 MB limit`;
  return null;
}

function fileNameFromUrl(url: string): string {
  try { return decodeURIComponent(new URL(url).pathname.split('/').pop() ?? 'File'); }
  catch { return 'File'; }
}

function fileIcon(name: string): string {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return '📄';
  if (ext === 'doc' || ext === 'docx') return '📝';
  return '📎';
}

// ─── Status checkmarks ──────────────────────────────────────────────────────
// ✓   = SENT       (delivered to server)
// ✓✓  = DELIVERED  (the recipient's client received it)
// ✓✓  = READ       (recipient actually opened the chat) — same glyph, blue color

function StatusTicks({ status }: { readonly status: MessageStatus }) {
  const { t } = useTranslation();
  const cls = status.toLowerCase();
  const glyph = status === 'SENT' ? '✓' : '✓✓';
  let label = t('chat.sent');
  if (status === 'DELIVERED') label = t('chat.delivered');
  else if (status === 'READ') label = t('chat.read');
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
  /** Ticket name/title (serviceType) — the primary identifier for the conversation. */
  title: string;
  /** Ticket body — shown as secondary preview text. */
  description: string;
  status: TicketStatus | null;
  priority: TicketPriority | null;
  otherName: string;
  otherProfilePictureUrl: string | null;
  /** Inbox ordering + preview + unread, from the room summary. */
  lastMessageContent: string | null;
  lastMessageType: MessageType | null;
  lastMessageTimestamp: string | null;
  unreadCount: number;
};

const QUICK_REPLY_KEYS = ['chat.quick_0', 'chat.quick_1', 'chat.quick_2', 'chat.quick_3'];

// ─── Sub-components ──────────────────────────────────────────────────────────

function InboxRow({ conv, selected, unreadCount, timestamp, onSelect, onDelete, deleteTitle, locale, yesterdayLabel }: {
  conv: Conversation;
  selected: boolean;
  unreadCount: number;
  timestamp: string | null;
  onSelect: () => void;
  onDelete: () => void;
  deleteTitle: string;
  locale: string;
  yesterdayLabel: string;
}) {
  const hasUnread = unreadCount > 0;
  return (
    <div className={`inbox-row${selected ? ' selected' : ''}${hasUnread ? ' unread' : ''}`} onClick={onSelect}>
      <div className="avatar" style={{ width: 36, height: 36, fontSize: 11, background: 'var(--navy-900)', color: 'var(--amber-500)', ...(conv.otherProfilePictureUrl ? { padding: 0, overflow: 'hidden' } : {}) }}>
        {conv.otherProfilePictureUrl
          ? <img src={conv.otherProfilePictureUrl} alt={conv.otherName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : getInitials(conv.otherName)}
      </div>
      <div style={{ minWidth: 0 }}>
        {/* Primary = the other participant's name; secondary = the ticket title. */}
        <div className="inbox-name">
          {conv.otherName}
          {conv.ticketId !== null && <span className="ticket-id">· {formatTicketId(conv.ticketId)}</span>}
        </div>
        <div className="inbox-preview">
          {conv.title}
        </div>
      </div>
      <div className="inbox-time-col">
        {timestamp && <div className="inbox-time">{formatInboxTime(timestamp, locale, yesterdayLabel)}</div>}
        {hasUnread && (
          <span
            aria-label={`${unreadCount} unread`}
            style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              minWidth: 18, height: 18, padding: '0 5px', borderRadius: 999,
              background: 'var(--amber-500)', color: 'var(--navy-900)',
              fontSize: 11, fontWeight: 700, lineHeight: 1,
            }}
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
        <button
          type="button"
          className="inbox-row-delete"
          title={deleteTitle}
          aria-label={deleteTitle}
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          style={{ border: 'none', background: 'transparent', color: 'var(--text-muted)', cursor: 'pointer', padding: 2, lineHeight: 0 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m2 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          </svg>
        </button>
      </div>
    </div>
  );
}

function MessageBubble({ msg, isMine, senderName, profilePictureUrl, locale, youLabel, onEdit, onDelete, isEditing, editText, onEditTextChange, onSaveEdit, onCancelEdit }: {
  msg: ChatMessage; isMine: boolean; senderName: string; profilePictureUrl?: string | null; locale: string; youLabel: string;
  onEdit?: () => void; onDelete?: () => void;
  isEditing?: boolean; editText?: string; onEditTextChange?: (v: string) => void; onSaveEdit?: () => void; onCancelEdit?: () => void;
}) {
  const { t } = useTranslation();
  if (msg.type === 'SYSTEM') {
    return <div className="sys-msg"><span>{renderSystemMessage(msg.content, t)}</span></div>;
  }

  const avatar = (
    <div className="avatar" style={{ width: 30, height: 30, fontSize: 11, flexShrink: 0, background: isMine ? 'var(--navy-700)' : 'var(--navy-900)', color: isMine ? '#fff' : 'var(--amber-500)', ...(profilePictureUrl ? { padding: 0, overflow: 'hidden' } : {}) }}>
      {profilePictureUrl
        ? <img src={profilePictureUrl} alt={senderName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
        : getInitials(senderName)}
    </div>
  );

  const meta = (
    <div className="bubble-meta">
      {isMine ? youLabel : senderName} · {formatMsgTime(msg.timestamp, locale)}
      {msg.editedAt && !msg.deleted && <> · <span style={{ fontStyle: 'italic' }}>{t('chat.edited')}</span></>}
      {isMine && !msg.deleted && <> · <StatusTicks status={msg.status} /></>}
    </div>
  );

  // A deleted message shows a placeholder for everyone, regardless of type.
  if (msg.deleted) {
    return (
      <div className={`msg-row${isMine ? ' mine' : ''}`}>
        {avatar}
        <div>
          <div className="bubble" style={{ fontStyle: 'italic', color: 'var(--text-muted)', background: 'transparent', border: '1px dashed var(--border)' }}>
            {t('chat.messageDeleted')}
          </div>
          {meta}
        </div>
      </div>
    );
  }

  const canModify = isMine && msg.type === 'TEXT';

  if (msg.type === 'IMAGE') {
    return (
      <div className={`msg-row${isMine ? ' mine' : ''}`}>
        {avatar}
        <div>
          <a href={msg.content} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
            <img
              src={msg.content}
              alt="Image"
              style={{ maxWidth: 240, maxHeight: 240, borderRadius: 10, display: 'block', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid var(--border)' }}
            />
          </a>
          {meta}
        </div>
      </div>
    );
  }

  if (msg.type === 'FILE') {
    const name = fileNameFromUrl(msg.content);
    return (
      <div className={`msg-row${isMine ? ' mine' : ''}`}>
        {avatar}
        <div>
          <a
            href={msg.content}
            target="_blank"
            rel="noopener noreferrer"
            className="bubble"
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', maxWidth: 260 }}
          >
            <span style={{ fontSize: 22, lineHeight: 1 }}>{fileIcon(name)}</span>
            <span style={{ fontSize: 13, wordBreak: 'break-all' }}>{name}</span>
          </a>
          {meta}
        </div>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className={`msg-row${isMine ? ' mine' : ''}`}>
        {avatar}
        <div style={{ minWidth: 220 }}>
          <textarea
            value={editText ?? ''}
            onChange={(e) => onEditTextChange?.(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSaveEdit?.(); }
              if (e.key === 'Escape') onCancelEdit?.();
            }}
            autoFocus
            rows={2}
            style={{ width: '100%', boxSizing: 'border-box', borderRadius: 10, border: '1px solid var(--navy-600)', padding: '8px 10px', fontFamily: 'inherit', fontSize: 14, resize: 'vertical', outline: 'none' }}
          />
          <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
            <button className="btn btn-primary btn-sm" onClick={() => onSaveEdit?.()}>{t('chat.editSave')}</button>
            <button className="btn btn-secondary btn-sm" onClick={() => onCancelEdit?.()}>{t('chat.editCancel')}</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`msg-row${isMine ? ' mine' : ''}`}>
      {avatar}
      <div className="msg-body" style={{ position: 'relative' }}>
        <div className="bubble">{msg.content}</div>
        {meta}
        {canModify && (
          <div className="msg-actions" style={{ display: 'flex', gap: 4, marginTop: 2 }}>
            <button type="button" onClick={onEdit} className="msg-action-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11.5, padding: '2px 4px' }}>
              {t('chat.editMessage')}
            </button>
            <button type="button" onClick={onDelete} className="msg-action-btn" style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#B91C1C', fontSize: 11.5, padding: '2px 4px' }}>
              {t('chat.deleteMessage')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator({ name }: { readonly name: string }) {
  const { t } = useTranslation();
  return (
    <div className="typing-indicator">
      <span className="typing-dots"><span /><span /><span /></span>
      {name} {t('chat.isTyping')}
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ChatPage() {
  useSEO({ title: "Messages", robots: "noindex, nofollow" });
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const todayLabel = t('chat.today');
  const yesterdayLabel = t('chat.yesterday');
  const youLabel = t('chat.you');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useBreakpoint();
  const { accessToken, role, refreshSession } = useAuth();
  const { notifications, markRead } = useNotifications();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? '';
  const currentUserName = currentUserQuery.data
    ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
    : youLabel;
  const currentUserProfilePicUrl = currentUserQuery.data?.profilePictureUrl ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  // Derived from URL — deep-link and in-page navigation both work without separate state.
  const selectedRoomId = searchParams.get('room');

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'unread'>('all');
  const [sendError, setSendError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  // Rate-limit / anti-spam feedback (driven by server errors on /user/queue/errors)
  const [confirmDeleteRoom, setConfirmDeleteRoom] = useState<Conversation | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');
  const [rateLimitMsg, setRateLimitMsg] = useState<string | null>(null);
  // Seconds remaining on a send cooldown (counts down to 0 via an interval).
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSendAttemptRef = useRef(0);
  const prevCooldownRef = useRef(0);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  // Track which incoming messages we've already marked as DELIVERED/READ to avoid spam
  const ackedRef = useRef<Set<number>>(new Set());

  const isProvider = role === 'PROVIDER';

  // Load tickets (role-specific) for display info
  const ticketsQuery = useQuery({
    queryKey: ['chatInboxTickets', isProvider],
    queryFn: () => (isProvider ? listProviderTickets(accessToken) : listTickets(accessToken)),
    enabled: Boolean(accessToken),
  });

  // Source of truth for inbox: ALL chat rooms this user participates in.
  // This catches rooms whose ticket data isn't in our tickets query
  // (e.g. older tickets, edge cases where chatRoomId isn't populated).
  const roomsQuery = useQuery({
    queryKey: ['chatRoomsList'],
    queryFn: () => getChatRooms(accessToken),
    enabled: Boolean(accessToken),
    // Keep ordering + unread counts fresh for conversations the user isn't
    // currently viewing (those messages arrive on other rooms' topics). The
    // open conversation updates instantly via the WebSocket overrides below.
    refetchInterval: 8000,
    refetchOnWindowFocus: true,
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

  // Derive messages from the React Query cache — single source of truth.
  // The REST endpoint returns DESC (newest first); we reverse to ASC for display.
  // WS handlers below write into the same cache via setQueryData, so switching
  // rooms always shows the right messages with no race condition.
  const messages = useMemo<ChatMessage[]>(() => {
    if (!messagesQuery.data) return [];
    return [...messagesQuery.data].reverse();
  }, [messagesQuery.data]);

  // Reset acked set when switching rooms
  useEffect(() => {
    ackedRef.current.clear();
  }, [selectedRoomId]);

  // WebSocket handlers — write directly to the React Query cache.
  // The incoming message's chatRoomId tells us which room's cache to update,
  // so this works correctly even if the user switched rooms mid-flight.
  const upsertMessage = useCallback((incoming: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      ['chatMessages', incoming.chatRoomId],
      (old) => {
        if (!old) return [incoming];
        const idx = old.findIndex(m => m.id === incoming.id);
        if (idx >= 0) {
          const next = [...old];
          next[idx] = { ...next[idx], ...incoming };
          return next;
        }
        // REST returns DESC (newest first), so prepend
        return [incoming, ...old];
      },
    );
  }, [queryClient]);

  const handleStatusUpdate = useCallback((incoming: ChatMessage) => {
    queryClient.setQueryData<ChatMessage[]>(
      ['chatMessages', incoming.chatRoomId],
      (old) => {
        if (!old) return old;
        return old.map(m =>
          m.id === incoming.id
            ? { ...m, status: incoming.status, deliveredAt: incoming.deliveredAt, readAt: incoming.readAt }
            : m,
        );
      },
    );
  }, [queryClient]);

  const handleTypingEvent = useCallback((event: { userId: string; typing: boolean }) => {
    if (event.userId === currentUserId) return;
    setIsOtherTyping(event.typing);
    if (event.typing) {
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setIsOtherTyping(false), 4000);
    }
  }, [currentUserId]);

  // Server rejected a message (rate limit / flood / duplicate / length).
  // Show a clear message and, when a retry hint is given, start a cooldown that
  // disables the send button until messaging is allowed again.
  const handleChatError = useCallback((err: ChatError) => {
    if (err.code === 'DUPLICATE') setRateLimitMsg(t('chat.rateLimit_duplicate'));
    else if (err.code === 'TOO_LONG') setRateLimitMsg(t('chat.rateLimit_tooLong'));
    else setRateLimitMsg(t('chat.rateLimit_tooFast')); // FLOOD / RATE_LIMIT_*
    if (err.retryAfterSeconds > 0) setCooldownRemaining(err.retryAfterSeconds);
  }, [t]);

  const { sendMessage, sendTyping, sendStatus, sendEdit, sendDelete, connected: wsConnected } = useChatWebSocket({
    chatRoomId: selectedRoomId,
    accessToken,
    onMessage: upsertMessage,
    onTyping: handleTypingEvent,
    onStatusUpdate: handleStatusUpdate,
    onError: handleChatError,
    refreshSession,
  });

  // Count the cooldown down once per second.
  useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const id = setInterval(() => setCooldownRemaining((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownRemaining]);

  // Dismiss the banner the moment a running cooldown elapses.
  useEffect(() => {
    if (prevCooldownRef.current > 0 && cooldownRemaining === 0) setRateLimitMsg(null);
    prevCooldownRef.current = cooldownRemaining;
  }, [cooldownRemaining]);

  const isCoolingDown = cooldownRemaining > 0;

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
  const allConversations: Conversation[] = useMemo(() => {
    const rooms: ChatRoomSummary[] = roomsQuery.data ?? [];

    // Index tickets by their chatRoomId for O(1) lookup
    const ticketByRoom = new Map<string, Ticket>();
    for (const t of ticketsQuery.data ?? []) {
      if (t.chatRoomId) ticketByRoom.set(t.chatRoomId, t);
    }

    return rooms.map(room => {
      const ticket = ticketByRoom.get(room.id);
      if (ticket) {
        return {
          roomId: room.id,
          ticketId: ticket.id,
          title: ticket.serviceType?.trim() || ticket.description || room.otherParticipantName,
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority ?? 'LOW',
          otherName: isProvider
            ? (ticket.submittedByName ?? room.otherParticipantName)
            : (ticket.assignedServiceProviderName ?? room.otherParticipantName),
          otherProfilePictureUrl: room.otherParticipantProfilePictureUrl,
          lastMessageContent: room.lastMessageContent,
          lastMessageType: room.lastMessageType,
          lastMessageTimestamp: room.lastMessageTimestamp,
          unreadCount: room.unreadCount,
        };
      }
      // No ticket match — surface the conversation with a fallback so the user
      // can still open it. Once a message loads we'll know the other party.
      return {
        roomId: room.id,
        ticketId: null,
        title: room.otherParticipantName,
        description: t('chat.conversation'),
        status: null,
        priority: 'LOW',
        otherName: room.otherParticipantName,
        otherProfilePictureUrl: room.otherParticipantProfilePictureUrl,
        lastMessageContent: room.lastMessageContent,
        lastMessageType: room.lastMessageType,
        lastMessageTimestamp: room.lastMessageTimestamp,
        unreadCount: room.unreadCount,
      };
    });
  }, [roomsQuery.data, ticketsQuery.data, isProvider]);

  // Always look up the selected conversation from the unfiltered list so that
  // navigating to a room via a notification works regardless of the active tab
  // or search filter.
  const selectedConv = allConversations.find(c => c.roomId === selectedRoomId) ?? null;

  // Per-room unread state for the inbox: any unread NEW_MESSAGE notification
  // whose chatRoomId matches the row means we render the row's name in bold.
  const unreadRoomIds = useMemo(() => {
    const set = new Set<string>();
    for (const n of notifications) {
      if (n.type === 'NEW_MESSAGE' && !n.read && n.chatRoomId) {
        set.add(n.chatRoomId);
      }
    }
    return set;
  }, [notifications]);

  // Last message for inbox preview (current room only — keeping it simple)
  const lastMsgForRoom = useMemo(() => {
    if (!selectedRoomId || messages.length === 0) return null;
    return messages[messages.length - 1];
  }, [selectedRoomId, messages]);

  const imageLabel = t('chat.preview_image');
  const fileLabel = t('chat.preview_file');

  // Decorate every conversation with its effective preview / unread / sort key,
  // applying live overrides for the open room (which the WebSocket keeps current
  // and whose messages are marked read on open), then sort newest-first. The
  // backend already returns rooms sorted, but we re-sort so the open conversation
  // jumps to the top instantly when a message is sent/received — no reload.
  type DecoratedRow = {
    conv: Conversation; preview: string; unread: number; iso: string | null; sortKey: number;
  };
  const rows: DecoratedRow[] = useMemo(() => {
    const previewOf = (content: string | null, type: MessageType | null, fallback: string) => {
      if (!content) return fallback;
      if (type === 'IMAGE') return imageLabel;
      if (type === 'FILE') return fileLabel;
      if (type === 'SYSTEM') return renderSystemMessage(content, t);
      return content;
    };
    const q = search.trim().toLowerCase();
    return allConversations
      .filter(c => !q || c.title.toLowerCase().includes(q) || c.otherName.toLowerCase().includes(q) || c.description.toLowerCase().includes(q))
      .map<DecoratedRow>(c => {
        const isSelected = c.roomId === selectedRoomId;
        const live = isSelected ? lastMsgForRoom : null;
        const iso = live ? live.timestamp : c.lastMessageTimestamp;
        // Opening a conversation marks it read → 0. Otherwise use the backend
        // count, falling back to a notification signal for just-arrived messages.
        let unread = isSelected ? 0 : c.unreadCount;
        if (!isSelected && unread === 0 && unreadRoomIds.has(c.roomId)) unread = 1;
        const preview = live
          ? previewOf(live.content, live.type, c.description)
          : previewOf(c.lastMessageContent, c.lastMessageType, c.description);
        return { conv: c, preview, unread, iso, sortKey: iso ? new Date(iso).getTime() : 0 };
      })
      .sort((a, b) => b.sortKey - a.sortKey);
  }, [allConversations, search, selectedRoomId, lastMsgForRoom, unreadRoomIds, imageLabel, fileLabel, t]);

  const unreadRows = rows.filter(r => r.unread > 0);
  const readRows = rows.filter(r => r.unread === 0);
  const activeRows = rows.filter(r => r.conv.status !== null && ['APPROVED', 'IN_TRANSIT'].includes(r.conv.status));
  const totalUnread = unreadRows.length;

  // Auto-scroll the thread to bottom on new messages / typing
  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, isOtherTyping]);

  const selectRoom = (roomId: string) => {
    // Clear the unread bold by marking any unread NEW_MESSAGE notifications
    // for this room as read. Safe to run even when re-clicking the same room.
    for (const n of notifications) {
      if (n.type === 'NEW_MESSAGE' && !n.read && n.chatRoomId === roomId) {
        markRead.mutate(n.id);
      }
    }
    if (roomId === selectedRoomId) return;
    setSearchParams({ room: roomId });
    ackedRef.current.clear();
    setIsOtherTyping(false);
    setText('');
    setSendError(null);
    setStagedFiles(prev => { prev.forEach(sf => { if (sf.objectUrl) URL.revokeObjectURL(sf.objectUrl); }); return []; });
    // After opening, messages get marked READ over the socket; give that a moment
    // to persist, then refresh the room list so the unread badge clears server-side
    // (the open room already shows 0 via the live override).
    window.setTimeout(() => queryClient.invalidateQueries({ queryKey: ['chatRoomsList'] }), 1500);
  };

  const handleBack = () => {
    setSearchParams({});
  };

  // ── Delete a conversation from this user's inbox ──
  async function handleDeleteRoom(conv: Conversation) {
    try {
      await deleteChatRoom(conv.roomId, accessToken);
      if (conv.roomId === selectedRoomId) setSearchParams({});
      queryClient.invalidateQueries({ queryKey: ['chatRoomsList'] });
    } catch {
      // Non-fatal; leave the row in place.
    } finally {
      setConfirmDeleteRoom(null);
    }
  }

  // ── Edit / delete an individual message (own messages only) ──
  function startEdit(msg: ChatMessage) {
    setEditingId(msg.id);
    setEditText(msg.content);
  }
  function saveEdit() {
    if (editingId == null || !selectedRoomId || !currentUserId) return;
    const trimmed = editText.trim();
    if (trimmed.length === 0) return;
    sendEdit({ messageId: editingId, chatRoomId: selectedRoomId, userId: currentUserId, content: trimmed });
    setEditingId(null);
    setEditText('');
  }
  function deleteMessage(msg: ChatMessage) {
    if (!selectedRoomId || !currentUserId) return;
    sendDelete({ messageId: msg.id, chatRoomId: selectedRoomId, userId: currentUserId });
  }

  const handleSend = async () => {
    setSendError(null);
    // Respect an active cooldown and a light local flood guard. The server is
    // still authoritative — these just avoid pointless round-trips.
    if (isCoolingDown) return;
    const nowMs = Date.now();
    if (nowMs - lastSendAttemptRef.current < 400) return;
    lastSendAttemptRef.current = nowMs;

    const hasText = text.trim().length > 0;
    const hasFiles = stagedFiles.length > 0;
    if (!hasText && !hasFiles) return;
    if (!selectedRoomId) { setSendError('No room selected'); return; }
    if (!currentUserId) { setSendError('Current user not loaded'); return; }
    if (!otherParticipantId) { setSendError('Recipient not resolved'); return; }
    if (!wsConnected) { setSendError('WebSocket not connected'); return; }

    if (hasFiles) {
      setIsUploading(true);
      for (const sf of stagedFiles) {
        try {
          const url = await uploadFileToServer(sf.file, 'chat', accessToken);
          const isImage = sf.file.type.startsWith('image/');
          const result = sendMessage({
            senderId: currentUserId, recipientId: otherParticipantId,
            chatRoomId: selectedRoomId, content: url,
            type: isImage ? 'IMAGE' : 'FILE',
          });
          if (!result.ok) { setSendError(`Send failed: ${result.reason}`); setIsUploading(false); return; }
        } catch {
          setSendError(t('chat.uploadFailed'));
          setIsUploading(false);
          return;
        }
      }
      stagedFiles.forEach(sf => { if (sf.objectUrl) URL.revokeObjectURL(sf.objectUrl); });
      setStagedFiles([]);
      setIsUploading(false);
    }

    if (hasText) {
      const result = sendMessage({
        senderId: currentUserId, recipientId: otherParticipantId,
        chatRoomId: selectedRoomId, content: text.trim(), type: 'TEXT',
      });
      if (!result.ok) { setSendError(`Send failed: ${result.reason}`); return; }
      setText('');
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    sendTyping({ chatRoomId: selectedRoomId, userId: currentUserId, typing: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextChange = (value: string) => {
    setText(value);
    // Clear a non-cooldown notice (duplicate / too-long) as soon as they edit.
    if (rateLimitMsg && !isCoolingDown) setRateLimitMsg(null);
    if (!selectedRoomId || !currentUserId) return;
    sendTyping({ chatRoomId: selectedRoomId, userId: currentUserId, typing: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      sendTyping({ chatRoomId: selectedRoomId!, userId: currentUserId, typing: false });
    }, 2500);
  };

  const handleCameraCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const err = validateAttachment(file);
    if (err) { setSendError(err); return; }
    const objectUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
    setStagedFiles(prev => [...prev, { localId: crypto.randomUUID(), file, objectUrl }]);
  };

  const handleAttachmentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files ?? []);
    e.target.value = '';
    if (!selected.length) return;
    const errors: string[] = [];
    const valid: StagedFile[] = [];
    for (const file of selected) {
      if (stagedFiles.length + valid.length >= MAX_ATTACHMENTS) {
        errors.push(`Maximum ${MAX_ATTACHMENTS} attachments allowed`);
        break;
      }
      const err = validateAttachment(file);
      if (err) { errors.push(err); continue; }
      const objectUrl = file.type.startsWith('image/') ? URL.createObjectURL(file) : null;
      valid.push({ localId: crypto.randomUUID(), file, objectUrl });
    }
    if (errors.length) setSendError(errors[0]);
    if (valid.length) setStagedFiles(prev => [...prev, ...valid]);
  };

  const removeStagedFile = (localId: string) => {
    setStagedFiles(prev => {
      const f = prev.find(s => s.localId === localId);
      if (f?.objectUrl) URL.revokeObjectURL(f.objectUrl);
      return prev.filter(s => s.localId !== localId);
    });
  };

  // Group messages by day for separators
  const messageGroups = useMemo(() => {
    const groups: Array<{ dayLabel: string; messages: ChatMessage[] }> = [];
    let currentDay = '';
    for (const msg of messages) {
      const day = new Date(msg.timestamp).toLocaleDateString(locale);
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ dayLabel: formatDayLabel(msg.timestamp, locale, todayLabel, yesterdayLabel), messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages, locale, todayLabel, yesterdayLabel]);

  const canSend = (text.trim().length > 0 || stagedFiles.length > 0) && !isUploading && !isCoolingDown;

  return (
    <div className={`chat-shell${selectedRoomId ? ' chat-shell--thread-open' : ''}`}>

      {/* ── Inbox sidebar ── */}
      <aside className="inbox">
        <div className="inbox-head">
          <h2>{t("chat.inbox")}</h2>
          <div className="inbox-search">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" style={{ color: 'var(--text-muted)', flexShrink: 0 }}>
              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="M11 11l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input placeholder={t("chat.messagePlaceholder")} value={search} onChange={e => setSearch(e.target.value)} />
          </div>
        </div>

        <div className="inbox-tabs">
          <button aria-pressed={tab === 'all'} onClick={() => setTab('all')}>
            {t('chat.tabAll')}
            <span className="mono" style={{ fontSize: '10.5px', color: 'var(--text-muted)', marginLeft: 4 }}>
              {(roomsQuery.data?.length ?? 0).toString().padStart(2, '0')}
            </span>
          </button>
          <button aria-pressed={tab === 'active'} onClick={() => setTab('active')}>{t('chat.tabActive')}</button>
          <button aria-pressed={tab === 'unread'} onClick={() => setTab('unread')}>
            {t('chat.tabUnread')}
            {totalUnread > 0 && (
              <span className="mono" style={{ fontSize: '10.5px', color: 'var(--amber-700)', marginLeft: 4, fontWeight: 700 }}>
                {totalUnread.toString().padStart(2, '0')}
              </span>
            )}
          </button>
        </div>

        <div className="inbox-list">
          {(ticketsQuery.isLoading || roomsQuery.isLoading) && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('common.loading')}</div>
          )}
          {!ticketsQuery.isLoading && !roomsQuery.isLoading && rows.length === 0 && (
            <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t("chat.noConversations")}</div>
          )}

          {(() => {
            const renderRow = (r: typeof rows[number]) => (
              <InboxRow
                key={r.conv.roomId}
                conv={r.conv}
                selected={r.conv.roomId === selectedRoomId}
                unreadCount={r.unread}
                timestamp={r.iso}
                onSelect={() => selectRoom(r.conv.roomId)}
                onDelete={() => setConfirmDeleteRoom(r.conv)}
                deleteTitle={t('chat.deleteConversation')}
                locale={locale}
                yesterdayLabel={yesterdayLabel}
              />
            );
            const sectionHeading = (key: string, label: string, count?: number) => (
              <div key={key} className="inbox-section-heading" style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px 6px', fontFamily: 'var(--font-mono)', fontSize: 10.5, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                {label}{count != null && count > 0 && <span style={{ color: 'var(--amber-700)', fontWeight: 700 }}>{count}</span>}
              </div>
            );

            if (tab === 'unread') {
              return unreadRows.length === 0
                ? <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('chat.noUnread')}</div>
                : unreadRows.map(renderRow);
            }
            if (tab === 'active') {
              return activeRows.length === 0
                ? <div style={{ padding: '32px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>{t('chat.noConversations')}</div>
                : activeRows.map(renderRow);
            }
            // tab === 'all' → dedicated Unread section, then All Conversations.
            return (
              <>
                {unreadRows.length > 0 && [
                  sectionHeading('h-unread', t('chat.sectionUnread'), totalUnread),
                  ...unreadRows.map(renderRow),
                ]}
                {readRows.length > 0 && [
                  unreadRows.length > 0 ? sectionHeading('h-all', t('chat.sectionAll')) : null,
                  ...readRows.map(renderRow),
                ]}
              </>
            );
          })()}
        </div>
      </aside>

      {/* ── Right side: back button + conv/empty panel ── */}
      <div className="chat-right">
        <button className="conv-back-btn" type="button" onClick={handleBack}>
          ← {t("chat.inbox")}
        </button>

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
              : (isProvider ? t('chat.categoryCustomer') : t('chat.categoryProvider'));
            // Sub-line bits we can actually compute from backend data
            const subBits: string[] = [];
            if (profile?.yearsOfExperience != null) {
              subBits.push(`${profile.yearsOfExperience} ${t('profile.yr')} ${t('providerCard.experience')}`);
            }
            if (profile?.pricePerHour != null) {
              subBits.push(`€${profile.pricePerHour}${t('common.perHour')}`);
            }
            if (profile?.serviceRadiusKm != null) {
              subBits.push(`${profile.serviceRadiusKm} ${t('profile.kmRadius')}`);
            }
            const subLine = subBits.length > 0 ? subBits.join(' · ') : null;

            return (
              <div className="conv-head">
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: 'var(--navy-900)', color: 'var(--amber-500)', ...(selectedConv.otherProfilePictureUrl ? { padding: 0, overflow: 'hidden' } : {}) }}>
                  {selectedConv.otherProfilePictureUrl
                    ? <img src={selectedConv.otherProfilePictureUrl} alt={selectedConv.otherName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getInitials(selectedConv.otherName)}
                </div>
                <div className="conv-name" style={{ minWidth: 0 }}>
                  {/* Header is tied to the TICKET — its title stays fixed for the
                      whole conversation, never the latest message or participant. */}
                  <h2>
                    {selectedConv.title}
                    {selectedConv.ticketId !== null && (
                      <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 14 }}>
                        {' '}· {formatTicketId(selectedConv.ticketId)}
                      </span>
                    )}
                  </h2>
                  <div className="sub">
                    {/* Participant + their role/details live in the sub-line. */}
                    <span>{selectedConv.otherName} · {categoryLabel}</span>
                    {wsConnected && <> · <span style={{ color: 'var(--emerald-700)' }}>● {t('chat.online')}</span></>}
                    {subLine && <> · {subLine}</>}
                  </div>
                </div>
                <span style={{ flex: 1 }} />
                {otherIsProvider && otherParticipantId && (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => navigate(`/providers/${otherParticipantId}`)}
                  >
                    {t('chat.goToProfile')}
                  </button>
                )}
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
                  {t('chat.phaseLabel')} {phase.num}{phase.labelKey ? ` · ${t(phase.labelKey)}` : ''}
                </span>
                <a href={`/tickets/${selectedConv.ticketId}`} className="btn btn-secondary btn-sm">
                  {t('chat.openTicketBtn')}
                </a>
              </div>
            );
          })()}

          {/* Message thread (scrolls internally) */}
          <div className="conv-thread" ref={threadRef}>
            {messagesQuery.isLoading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center' }}>{t('chat.loadingMessages')}</div>
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
                    profilePictureUrl={msg.senderId === currentUserId ? currentUserProfilePicUrl : selectedConv.otherProfilePictureUrl}
                    locale={locale}
                    youLabel={youLabel}
                    onEdit={() => startEdit(msg)}
                    onDelete={() => deleteMessage(msg)}
                    isEditing={editingId === msg.id}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => { setEditingId(null); setEditText(''); }}
                  />
                ))}
              </div>
            ))}

            {messages.length === 0 && !messagesQuery.isLoading && (
              <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', marginTop: 'auto' }}>
                {t('chat.noMessages')}
              </div>
            )}

            {isOtherTyping && <TypingIndicator name={selectedConv.otherName} />}
          </div>

          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            style={{ display: 'none' }}
            onChange={handleCameraCapture}
          />
          <input
            ref={attachInputRef}
            type="file"
            accept=".jpg,.jpeg,.png,.pdf,.doc,.docx"
            multiple
            style={{ display: 'none' }}
            onChange={handleAttachmentSelect}
          />

          {/* Composer */}
          <div className="composer">
            <div className="quick-replies">
              {QUICK_REPLY_KEYS.map(key => {
                const reply = t(key);
                return (
                  <button key={key} className="quick" onClick={() => handleTextChange(text ? `${text} ${reply}` : reply)}>
                    {reply}
                  </button>
                );
              })}
            </div>
            <div className="composer-wrap">
              {/* Staged files preview strip */}
              {stagedFiles.length > 0 && (
                <div style={{ display: 'flex', gap: 8, padding: '8px 0 4px', flexWrap: 'wrap' }}>
                  {stagedFiles.map(sf => (
                    <div key={sf.localId} style={{ position: 'relative', flexShrink: 0 }}>
                      {sf.objectUrl ? (
                        <img
                          src={sf.objectUrl}
                          alt={sf.file.name}
                          style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                        />
                      ) : (
                        <div style={{ width: 64, height: 64, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface-2)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                          <span style={{ fontSize: 22, lineHeight: 1 }}>{fileIcon(sf.file.name)}</span>
                          <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '0 4px', wordBreak: 'break-all', lineHeight: 1.2 }}>
                            {sf.file.name.length > 12 ? sf.file.name.slice(0, 10) + '…' : sf.file.name}
                          </span>
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => removeStagedFile(sf.localId)}
                        style={{ position: 'absolute', top: -6, right: -6, width: 18, height: 18, borderRadius: '50%', background: 'var(--navy-900)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 11, lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                        aria-label="Remove attachment"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <textarea
                placeholder={isMobile ? t('chat.typeMessage') : t('chat.typeMessageDesktop')}
                rows={isMobile ? 1 : 2}
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="composer-bottom">
                <button
                  className="icon-btn"
                  type="button"
                  title={t('chat.attachFile')}
                  aria-label={t('chat.attachFile')}
                  disabled={stagedFiles.length >= MAX_ATTACHMENTS || isUploading}
                  onClick={() => attachInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.41 17.41a2 2 0 01-2.83-2.83l8.49-8.49" />
                  </svg>
                </button>
                <button
                  className="icon-btn"
                  type="button"
                  title={t('chat.takePhoto')}
                  aria-label={t('chat.takePhoto')}
                  disabled={stagedFiles.length >= MAX_ATTACHMENTS || isUploading}
                  onClick={() => cameraInputRef.current?.click()}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                </button>
                <span className="muted mono" style={{ fontSize: '11px', letterSpacing: '0.05em' }}>
                  {t('chat.replyingTo')}{' '}
                  <span style={{ color: 'var(--text)' }}>
                    {selectedConv.ticketId !== null ? formatTicketId(selectedConv.ticketId) : selectedConv.otherName}
                  </span>
                </span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, fontFamily: 'var(--font-mono)', color: wsConnected ? 'var(--emerald-700)' : 'var(--text-muted)' }}>
                  <span style={{ width: 6, height: 6, borderRadius: 3, background: wsConnected ? 'var(--emerald-600)' : 'var(--slate-400)' }} />
                  {wsConnected ? t('chat.live') : t('chat.connecting')}
                </span>
                <span style={{ flex: 1 }} />
                <button className="btn btn-primary btn-sm" onClick={handleSend} disabled={!canSend}>
                  {isUploading
                    ? t("common.loading")
                    : isCoolingDown
                      ? t("chat.rateLimit_wait", { seconds: cooldownRemaining })
                      : t("chat.send")}
                  {!isUploading && !isCoolingDown && (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M14 8L2 2l3.5 6L2 14l12-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              </div>
              {rateLimitMsg && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#92400e', background: 'var(--amber-50, #fffbeb)', border: '1px solid var(--amber-200, #fde68a)', padding: '7px 10px', borderRadius: 6 }}>
                  {rateLimitMsg}{isCoolingDown ? ` ${t('chat.rateLimit_retryIn', { seconds: cooldownRemaining })}` : ''}
                </div>
              )}
              {sendError && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#B91C1C', background: '#FEE2E2', padding: '6px 10px', borderRadius: 6 }}>
                  {sendError}
                </div>
              )}
            </div>
          </div>
        </section>
      ) : selectedRoomId && roomsQuery.isLoading ? (
        <div className="chat-empty">
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>{t('chat.loadingConversation')}</div>
        </div>
      ) : (
        <div className="chat-empty">
          <div className="chat-empty-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>{t('chat.selectConversation')}</div>
          <div style={{ fontSize: 13 }}>{t('chat.selectConversationHint')}</div>
        </div>
      )}
      </div>{/* end .chat-right */}

      <ConfirmDialog
        open={confirmDeleteRoom !== null}
        title={t('chat.deleteConversation_title')}
        confirmLabel={t('chat.deleteConversation')}
        cancelLabel={t('deleteAccount.cancel')}
        onConfirm={() => { if (confirmDeleteRoom) handleDeleteRoom(confirmDeleteRoom); }}
        onCancel={() => setConfirmDeleteRoom(null)}
      >
        {t('chat.deleteConversation_body')}
      </ConfirmDialog>
    </div>
  );
}
