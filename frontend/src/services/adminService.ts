import type { DeclineProviderRequestDto, ProviderResponseDto } from "@/dto/admin";
import type { MessageResponseDto } from "@/dto/message";
import type { Provider } from "@/domain/admin";
import type { Message } from "@/domain/message";
import { mapProvider, mapProviders } from "@/mappers/adminMapper";
import { mapMessageResponse } from "@/mappers/messageMapper";
import { requestJson } from "@/services/httpClient";

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listPendingProviders(accessToken: string): Promise<Provider[]> {
  const data = await requestJson<ProviderResponseDto[]>(
    "/api/v1/admin/providers/pending",
    { headers: authHeader(accessToken) },
  );
  return mapProviders(data);
}

export async function approveProvider(id: string, accessToken: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/providers/${id}/approve`,
    { method: "POST", headers: authHeader(accessToken) },
  );
  return mapMessageResponse(data);
}

export async function declineProvider(
  id: string,
  reason: string,
  accessToken: string,
): Promise<Message> {
  const payload: DeclineProviderRequestDto = { reason };
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/admin/providers/${id}/decline`,
    {
      method: "POST",
      headers: { ...authHeader(accessToken), "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    },
  );
  return mapMessageResponse(data);
}
