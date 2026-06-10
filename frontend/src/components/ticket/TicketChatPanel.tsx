import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/context/auth';
import { useCurrentUser } from '@/hooks/useCurrentUser';
import { getChatRoom, getChatMessages } from '@/services/chatService';
import { uploadFile as uploadFileToServer } from '@/services/imageService';
import { useChatWebSocket } from '@/hooks/useChatWebSocket';
import type { Ticket } from '@/domain/ticket';
import type { ChatMessage } from '@/domain/chat';
import { renderSystemMessage } from '@/utils/systemMessage';

// ─── Attachment helpers ────────────────────────────────────────────────────────

const MAX_ATTACHMENTS = 5;
const MAX_FILE_BYTES = 10 * 1024 * 1024;
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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2) || '?';
}

function formatMsgTime(timestamp: string, locale: string): string {
  return new Date(timestamp).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit', hour12: false });
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

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusTicks({ status }: { status: ChatMessage['status'] }) {
  const { t } = useTranslation();
  const glyph = status === 'SENT' ? '✓' : '✓✓';
  const label = status === 'SENT' ? t('chat.sent') : status === 'DELIVERED' ? t('chat.delivered') : t('chat.read');
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
  locale,
  youLabel,
}: {
  msg: ChatMessage;
  isMine: boolean;
  senderName: string;
  locale: string;
  youLabel: string;
}) {
  const { t } = useTranslation();
  if (msg.type === 'SYSTEM') {
    return <div className="sys-msg"><span>{renderSystemMessage(msg.content, t)}</span></div>;
  }

  const avatar = (
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
  );

  const meta = (
    <div className="bubble-meta">
      {isMine ? youLabel : senderName} · {formatMsgTime(msg.timestamp, locale)}
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
              alt=""
              style={{ maxWidth: 200, maxHeight: 200, borderRadius: 10, display: 'block', objectFit: 'cover', cursor: 'zoom-in', border: '1px solid var(--border)' }}
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
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, textDecoration: 'none', maxWidth: 220 }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{fileIcon(name)}</span>
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
  const { t } = useTranslation();
  return (
    <div className="typing-indicator">
      <span className="typing-dots"><span /><span /><span /></span>
      {name} {t('chat.isTyping')}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TicketChatPanel({ ticket }: { ticket: Ticket }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const queryClient = useQueryClient();
  const { accessToken, refreshSession, role } = useAuth();
  const isProvider = role === 'PROVIDER';
  const currentUserQuery = useCurrentUser();
  const currentUserId = currentUserQuery.data?.id ?? '';
  const currentUserName = currentUserQuery.data
    ? `${currentUserQuery.data.firstName} ${currentUserQuery.data.lastName}`
    : t('chat.you');

  const chatRoomId = ticket.chatRoomId ?? null;
  const providerName = ticket.assignedServiceProviderName;
  const otherName = isProvider
    ? (ticket.submittedByName ?? t('chat.categoryCustomer'))
    : (providerName ?? t('chat.categoryProvider'));
  const otherPic = isProvider
    ? (ticket.submittedByProfilePictureUrl ?? null)
    : (ticket.assignedServiceProviderProfilePictureUrl ?? null);
  const otherProfileHref =
    !isProvider && ticket.assignedServiceProviderId
      ? `/providers/${ticket.assignedServiceProviderId}`
      : null;
  const otherRoleLabel = `${isProvider ? t('chat.categoryCustomer') : t('chat.categoryProvider')} · ${t('chat.roleLabel')}`;
  const hasOther = isProvider ? Boolean(ticket.submittedByName) : Boolean(providerName);
  const [isOtherTyping, setIsOtherTyping] = useState(false);
  const [text, setText] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const [stagedFiles, setStagedFiles] = useState<StagedFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const threadRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const ackedRef = useRef<Set<number>>(new Set());

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

  const messagesQuery = useQuery({
    queryKey: ['chatMessages', chatRoomId],
    queryFn: () => getChatMessages(chatRoomId!, accessToken),
    enabled: Boolean(chatRoomId && accessToken),
  });

  const messages = useMemo<ChatMessage[]>(() => {
    if (!messagesQuery.data) return [];
    return [...messagesQuery.data].reverse();
  }, [messagesQuery.data]);

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

  useEffect(() => {
    if (threadRef.current) {
      threadRef.current.scrollTop = threadRef.current.scrollHeight;
    }
  }, [messages.length, isOtherTyping]);

  const todayLabel = t('chat.today');
  const yesterdayLabel = t('chat.yesterday');

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

  const handleSend = async () => {
    setSendError(null);
    const hasText = text.trim().length > 0;
    const hasFiles = stagedFiles.length > 0;
    if (!hasText && !hasFiles) return;
    if (!chatRoomId || !currentUserId || !otherParticipantId || !wsConnected) return;

    if (hasFiles) {
      setIsUploading(true);
      for (const sf of stagedFiles) {
        try {
          const url = await uploadFileToServer(sf.file, 'chat', accessToken);
          const isImage = sf.file.type.startsWith('image/');
          const result = sendMessage({
            senderId: currentUserId, recipientId: otherParticipantId,
            chatRoomId, content: url, type: isImage ? 'IMAGE' : 'FILE',
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
        chatRoomId, content: text.trim(), type: 'TEXT',
      });
      if (!result.ok) { setSendError(`Send failed: ${result.reason}`); return; }
      setText('');
    }

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

  const canSend = wsConnected && Boolean(otherParticipantId) && !isUploading && (text.trim().length > 0 || stagedFiles.length > 0);

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
            background: hasOther ? 'var(--navy-900)' : 'var(--slate-200)',
            color: hasOther ? 'var(--amber-500)' : 'var(--slate-500)',
            ...(otherPic ? { padding: 0, overflow: 'hidden' } : {}),
          }}
        >
          {otherPic ? (
            <img
              src={otherPic}
              alt={otherName}
              style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }}
            />
          ) : (
            hasOther ? getInitials(otherName) : '?'
          )}
        </div>
        <div>
          <div className="row gap-8" style={{ gap: 8 }}>
            {hasOther && otherProfileHref ? (
              <Link
                to={otherProfileHref}
                style={{ fontSize: 14, letterSpacing: '-0.01em', fontWeight: 700, textDecoration: 'none', color: 'inherit' }}
              >
                {otherName}
              </Link>
            ) : (
              <b style={{ fontSize: 14, letterSpacing: '-0.01em' }}>
                {hasOther ? otherName : (isProvider ? t('chat.awaitingCustomer') : t('chat.noProviderYet'))}
              </b>
            )}
            {hasOther && wsConnected && (
              <span style={{ width: 6, height: 6, borderRadius: 3, background: 'var(--emerald-600)' }} />
            )}
          </div>
          <div className="mono muted" style={{ fontSize: 10.5, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {hasOther ? otherRoleLabel : t('chat.awaitingAssignment')}
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
          {chatRoomId ? (wsConnected ? t('chat.live') : t('chat.connecting')) : t('chat.noRoom')}
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
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{t('chat.noChat')}</div>
            <div style={{ fontSize: 13 }}>{t('chat.noRoomDesc')}</div>
          </div>
        )}

        {/* Loading */}
        {chatRoomId && messagesQuery.isLoading && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 'auto' }}>
            {t('chat.loadingMessages')}
          </div>
        )}

        {/* Empty */}
        {chatRoomId && !messagesQuery.isLoading && messages.length === 0 && (
          <div style={{ color: 'var(--text-muted)', fontSize: 13, textAlign: 'center', margin: 'auto' }}>
            {t('chat.noMessages')}
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
                senderName={msg.senderId === currentUserId ? currentUserName : otherName}
                locale={locale}
                youLabel={t('chat.you')}
              />
            ))}
          </div>
        ))}

        {isOtherTyping && <TypingIndicator name={otherName} />}
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
        {/* Staged files preview */}
        {stagedFiles.length > 0 && (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {stagedFiles.map(sf => (
              <div key={sf.localId} style={{ position: 'relative', flexShrink: 0 }}>
                {sf.objectUrl ? (
                  <img
                    src={sf.objectUrl}
                    alt={sf.file.name}
                    style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)', display: 'block' }}
                  />
                ) : (
                  <div style={{ width: 56, height: 56, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--slate-100)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                    <span style={{ fontSize: 18, lineHeight: 1 }}>{fileIcon(sf.file.name)}</span>
                    <span style={{ fontSize: 9, color: 'var(--text-muted)', textAlign: 'center', padding: '0 4px', wordBreak: 'break-all', lineHeight: 1.2 }}>
                      {sf.file.name.length > 10 ? sf.file.name.slice(0, 8) + '…' : sf.file.name}
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

        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
          <textarea
            placeholder={
              !chatRoomId
                ? t('chat.messagingUnavailable')
                : !wsConnected
                ? t('chat.connecting')
                : t('chat.typeMsgTicket')
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              <button
                className="icon-btn"
                type="button"
                title={t('chat.attachFile')}
                aria-label={t('chat.attachFile')}
                disabled={stagedFiles.length >= MAX_ATTACHMENTS || isUploading}
                onClick={() => attachInputRef.current?.click()}
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z" />
                  <circle cx="12" cy="13" r="4" />
                </svg>
              </button>
            </div>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleSend}
              disabled={!canSend}
            >
              {isUploading ? t('chat.sending') : t('chat.send')}
            </button>
          </div>
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
