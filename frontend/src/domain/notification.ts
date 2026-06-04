export type NotificationType = 'TICKET_STATUS_CHANGE' | 'NEW_MESSAGE' | 'PROVIDER_NEARBY';

export type AppNotification = {
  id: number;
  type: NotificationType;
  /** English fallback text — used only when the matching *Key below is absent. */
  title: string;
  body: string | null;
  /** i18next message keys + interpolation params; when present the UI renders these. */
  titleKey: string | null;
  bodyKey: string | null;
  params: Record<string, string> | null;
  ticketId: number | null;
  chatRoomId: string | null;
  aggregateCount: number;
  read: boolean;
  createdAt: string;
};
