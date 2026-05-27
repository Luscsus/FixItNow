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

  const notifications = query.data ?? [];
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
