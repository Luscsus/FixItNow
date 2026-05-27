export type NotificationType = 'TICKET_STATUS_CHANGE' | 'NEW_MESSAGE';

export type AppNotification = {
  id: number;
  type: NotificationType;
  title: string;
  body: string | null;
  ticketId: number | null;
  chatRoomId: string | null;
  aggregateCount: number;
  read: boolean;
  createdAt: string;
};
