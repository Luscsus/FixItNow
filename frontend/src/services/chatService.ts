import type { ChatMessage, ChatRoomDetails } from '@/domain/chat';
import { requestJson } from '@/services/httpClient';

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getChatRooms(accessToken: string): Promise<string[]> {
  return requestJson<string[]>('/api/chat/rooms', {
    headers: authHeader(accessToken),
  });
}

export async function getChatRoom(chatRoomId: string, accessToken: string): Promise<ChatRoomDetails> {
  return requestJson<ChatRoomDetails>(`/api/chat/${chatRoomId}`, {
    headers: authHeader(accessToken),
  });
}

export async function getChatMessages(
  chatRoomId: string,
  accessToken: string,
  page = 0,
  size = 50,
): Promise<ChatMessage[]> {
  return requestJson<ChatMessage[]>(
    `/api/chat/${chatRoomId}/messages?page=${page}&size=${size}`,
    { headers: authHeader(accessToken) },
  );
}
