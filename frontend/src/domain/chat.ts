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
