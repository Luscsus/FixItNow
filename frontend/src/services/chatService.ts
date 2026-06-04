import type { ChatMessage, ChatRoomDetails, ChatRoomSummary } from '@/domain/chat';
import { requestJson } from '@/services/httpClient';

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function getChatRooms(accessToken: string): Promise<ChatRoomSummary[]> {
  return requestJson<ChatRoomSummary[]>('/api/chat/rooms', {
    headers: authHeader(accessToken),
  });
}

/** Removes a conversation from the current user's inbox (the other party keeps it). */
export async function deleteChatRoom(chatRoomId: string, accessToken: string): Promise<void> {
  await requestJson<void>(`/api/chat/rooms/${chatRoomId}`, {
    method: 'DELETE',
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
