import type { ProviderDto } from "@/services/providerService";
import { requestJson } from "@/services/httpClient";

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

export async function listSavedProviders(accessToken: string): Promise<ProviderDto[]> {
  return requestJson<ProviderDto[]>("/api/v1/saved-providers", {
    headers: authHeader(accessToken),
  });
}

export async function saveProvider(accessToken: string, providerId: string): Promise<void> {
  await requestJson<{ message: string }>(`/api/v1/saved-providers/${providerId}`, {
    method: "POST",
    headers: authHeader(accessToken),
  });
}

export async function unsaveProvider(accessToken: string, providerId: string): Promise<void> {
  await requestJson<{ message: string }>(`/api/v1/saved-providers/${providerId}`, {
    method: "DELETE",
    headers: authHeader(accessToken),
  });
}
