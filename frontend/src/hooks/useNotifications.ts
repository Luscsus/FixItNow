import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/context/auth';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '@/services/notificationService';

export const NOTIFICATIONS_QUERY_KEY = ['notifications'] as const;

export function useNotifications() {
  const { accessToken, isAuthenticated } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: () => getNotifications(accessToken),
    enabled: Boolean(accessToken) && isAuthenticated,
  });

  // Defensive de-duplication: collapse notifications that are logically the
  // same event (same type + ticket + chat room + title + body). The list is
  // ordered newest-first, so the first occurrence we keep is the most recent.
  // Guards against any duplicate row sneaking into the feed.
  const rawNotifications = query.data ?? [];
  const seen = new Set<string>();
  const notifications = rawNotifications.filter((n) => {
    const key = `${n.type}|${n.ticketId ?? ""}|${n.chatRoomId ?? ""}|${n.title}|${n.body ?? ""}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const unreadCount = notifications.reduce((acc, n) => (n.read ? acc : acc + 1), 0);

  const markRead = useMutation({
    mutationFn: (id: number) => markNotificationRead(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  const markAllRead = useMutation({
    mutationFn: () => markAllNotificationsRead(accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY }),
  });

  return {
    notifications,
    unreadCount,
    isLoading: query.isLoading,
    markRead,
    markAllRead,
  };
}
