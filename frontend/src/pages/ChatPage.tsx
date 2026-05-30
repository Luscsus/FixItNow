import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/context/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { listTickets, listProviderTickets } from '@/services/ticketService';
import { getChatRoom, getChatRooms, getChatMessages } from '@/services/chatService';
import { getProvider } from '@/services/providerService';
import { uploadFile as uploadFileToServer } from '@/services/imageService';
import type { ChatRoomSummary } from '@/domain/chat';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import type { Ticket, TicketPriority, TicketStatus } from '@/domain/ticket';
import type { ChatMessage, MessageStatus } from '@/domain/chat';
import { useBreakpoint } from '@/hooks/useBreakpoint';

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
  otherProfilePictureUrl: string | null;
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
      <div className="avatar" style={{ width: 36, height: 36, fontSize: 11, background: 'var(--navy-900)', color: 'var(--amber-500)', ...(conv.otherProfilePictureUrl ? { padding: 0, overflow: 'hidden' } : {}) }}>
        {conv.otherProfilePictureUrl
          ? <img src={conv.otherProfilePictureUrl} alt={conv.otherName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
          : getInitials(conv.otherName)}
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

function MessageBubble({ msg, isMine, senderName, profilePictureUrl }: { msg: ChatMessage; isMine: boolean; senderName: string; profilePictureUrl?: string | null }) {
  if (msg.type === 'SYSTEM') {
    return <div className="sys-msg"><span>{msg.content}</span></div>;
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
      {isMine ? 'You' : senderName} · {formatMsgTime(msg.timestamp)}
      {isMine && <> · <StatusTicks status={msg.status} /></>}
    </div>
  );

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

  return (
    <div className={`msg-row${isMine ? ' mine' : ''}`}>
      {avatar}
      <div>
        <div className="bubble">{msg.content}</div>
        {meta}
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
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isMobile } = useBreakpoint();
  const { accessToken, role, refreshSession } = useAuth();
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? '';
  const currentUserName = currentUserQuery.data
    ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
    : 'You';
  const currentUserProfilePicUrl = currentUserQuery.data?.profilePictureUrl ?? null;

  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(searchParams.get('room'));

  // Deep-link support: when the `room` query param changes (e.g. opening a chat
  // from a notification while already on this page), sync it into the selection.
  useEffect(() => {
    const room = searchParams.get('room');
    if (room && room !== selectedRoomId) {
      setSelectedRoomId(room);
    }
  }, [searchParams, selectedRoomId]);

  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [search, setSearch] = useState('');
  const [tab, setTab] = useState<'all' | 'active' | 'unread'>('all');
  const [sendError, setSendError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
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

  // Unread = messages from the other person in the SELECTED room not yet READ.
  // Declared AFTER `messages` so the closure captures it correctly.
  const hasUnreadInSelectedRoom = useMemo(() => {
    if (!selectedRoomId || !currentUserId) return false;
    return messages.some(m => m.senderId !== currentUserId && m.status !== 'READ');
  }, [messages, selectedRoomId, currentUserId]);

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
          description: ticket.description,
          status: ticket.status,
          priority: ticket.priority ?? 'LOW',
          otherName: isProvider
            ? (ticket.submittedByName ?? room.otherParticipantName)
            : (ticket.assignedServiceProviderName ?? room.otherParticipantName),
          otherProfilePictureUrl: room.otherParticipantProfilePictureUrl,
        };
      }
      // No ticket match — surface the conversation with a fallback so the user
      // can still open it. Once a message loads we'll know the other party.
      return {
        roomId: room.id,
        ticketId: null,
        description: 'Conversation',
        status: null,
        priority: 'LOW',
        otherName: room.otherParticipantName,
        otherProfilePictureUrl: room.otherParticipantProfilePictureUrl,
      };
    });
  }, [roomsQuery.data, ticketsQuery.data, isProvider]);

  // Filtered list for the sidebar — separate from allConversations so that
  // selectedConv lookup is never blocked by an active search/tab filter.
  const conversations: Conversation[] = useMemo(() => {
    return allConversations
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
  }, [allConversations, search, tab, selectedRoomId, hasUnreadInSelectedRoom]);

  // Always look up the selected conversation from the unfiltered list so that
  // navigating to a room via a notification works regardless of the active tab
  // or search filter.
  const selectedConv = allConversations.find(c => c.roomId === selectedRoomId) ?? null;

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
    setSelectedRoomId(roomId);
    setSearchParams({ room: roomId });
    ackedRef.current.clear();
    setIsOtherTyping(false);
    setText('');
    setSendError(null);
    setStagedFiles(prev => { prev.forEach(sf => { if (sf.objectUrl) URL.revokeObjectURL(sf.objectUrl); }); return []; });
  };

  const handleBack = () => {
    setSelectedRoomId(null);
    setSearchParams({});
  };

  const handleSend = async () => {
    setSendError(null);
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
          setSendError('Upload failed — check your connection and try again.');
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
      const day = new Date(msg.timestamp).toLocaleDateString('en-US');
      if (day !== currentDay) {
        currentDay = day;
        groups.push({ dayLabel: formatDayLabel(msg.timestamp), messages: [] });
      }
      groups[groups.length - 1].messages.push(msg);
    }
    return groups;
  }, [messages]);

  const canSend = (text.trim().length > 0 || stagedFiles.length > 0) && !isUploading;

  return (
    <div className={`chat-shell${selectedRoomId ? ' chat-shell--thread-open' : ''}`}>

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

      {/* ── Right side: back button + conv/empty panel ── */}
      <div className="chat-right">
        <button className="conv-back-btn" type="button" onClick={handleBack}>
          ← Inbox
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
                <div className="avatar" style={{ width: 44, height: 44, fontSize: 15, background: 'var(--navy-900)', color: 'var(--amber-500)', ...(selectedConv.otherProfilePictureUrl ? { padding: 0, overflow: 'hidden' } : {}) }}>
                  {selectedConv.otherProfilePictureUrl
                    ? <img src={selectedConv.otherProfilePictureUrl} alt={selectedConv.otherName} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : getInitials(selectedConv.otherName)}
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
                {otherIsProvider && otherParticipantId && (
                  <button
                    className="btn btn-ghost btn-sm"
                    type="button"
                    onClick={() => navigate(`/providers/${otherParticipantId}`)}
                  >
                    Go to Profile
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
                    profilePictureUrl={msg.senderId === currentUserId ? currentUserProfilePicUrl : selectedConv.otherProfilePictureUrl}
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
              {QUICK_REPLIES.map(reply => (
                <button key={reply} className="quick" onClick={() => handleTextChange(text ? `${text} ${reply}` : reply)}>
                  {reply}
                </button>
              ))}
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
                placeholder={isMobile ? "Type a message…" : "Type a message… (Enter to send, Shift + Enter for newline)"}
                rows={isMobile ? 1 : 2}
                value={text}
                onChange={e => handleTextChange(e.target.value)}
                onKeyDown={handleKeyDown}
              />
              <div className="composer-bottom">
                <button
                  className="icon-btn"
                  type="button"
                  title="Attach file"
                  aria-label="Attach file"
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
                  title="Take photo"
                  aria-label="Take photo"
                  disabled={stagedFiles.length >= MAX_ATTACHMENTS || isUploading}
                  onClick={() => cameraInputRef.current?.click()}
                >
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
                  {isUploading ? 'Sending…' : 'Send'}
                  {!isUploading && (
                    <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
                      <path d="M14 8L2 2l3.5 6L2 14l12-6z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  )}
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
      ) : selectedRoomId && roomsQuery.isLoading ? (
        <div className="chat-empty">
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>Loading conversation…</div>
        </div>
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
      </div>{/* end .chat-right */}
    </div>
  );
}
