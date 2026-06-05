export type MessageType = 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ';

export type ChatMessage = {
  id: number;
  senderId: string;
  recipientId: string;
  chatRoomId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  timestamp: string;
  deliveredAt?: string | null;
  readAt?: string | null;
  editedAt?: string | null;
  deleted?: boolean;
};

export type EditMessagePayload = {
  messageId: number;
  chatRoomId: string;
  userId: string;
  content: string;
};

export type DeleteMessagePayload = {
  messageId: number;
  chatRoomId: string;
  userId: string;
};

export type ChatRoomDetails = {
  id: string;
  ticketId: number;
  customerId: string;
  providerId: string;
};

export type ChatRoomSummary = {
  id: string;
  otherParticipantId: string;
  otherParticipantName: string;
  otherParticipantProfilePictureUrl: string | null;
  /** Latest message preview + ordering data (null when the room has no messages). */
  lastMessageContent: string | null;
  lastMessageType: MessageType | null;
  lastMessageTimestamp: string | null;
  /** Messages addressed to the current user that aren't READ yet. */
  unreadCount: number;
};

export type ChatTypingEvent = {
  chatRoomId: string;
  userId: string;
  typing: boolean;
};

export type SendMessagePayload = {
  senderId: string;
  recipientId: string;
  chatRoomId: string;
  content: string;
  type: MessageType;
};

export type SendStatusPayload = {
  chatRoomId: string;
  messageId: number;
  userId: string;
  status: MessageStatus;
};

/** Sent to /user/queue/errors when a message is rejected by anti-spam rules. */
export type ChatError = {
  code: string;
  message: string;
  retryAfterSeconds: number;
  chatRoomId: string | null;
};
