import type { AppNotification } from '@/domain/notification';
import { requestJson } from '@/services/httpClient';

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getNotifications(accessToken: string): Promise<AppNotification[]> {
  return requestJson<AppNotification[]>('/api/notifications', {
    headers: authHeader(accessToken),
  });
}

export async function markNotificationRead(id: number, accessToken: string): Promise<void> {
  await requestJson<{ success: boolean }>(`/api/notifications/${id}/read`, {
    method: 'PUT',
    headers: authHeader(accessToken),
  });
}

export async function markAllNotificationsRead(accessToken: string): Promise<void> {
  await requestJson<{ success: boolean }>('/api/notifications/read-all', {
    method: 'PUT',
    headers: authHeader(accessToken),
  });
}

export async function deleteAllNotifications(accessToken: string): Promise<void> {
  await requestJson<{ success: boolean }>('/api/notifications', {
    method: 'DELETE',
    headers: authHeader(accessToken),
  });
}
