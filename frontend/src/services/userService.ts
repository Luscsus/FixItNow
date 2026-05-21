import type { UserResponseDto } from "@/dto/user";
import type { ProviderResponseDto } from "@/dto/admin";
import type { User } from "@/domain/user";
import type { Provider } from "@/domain/admin";
import { mapProvider, mapProviders } from "@/mappers/adminMapper";
import { requestJson } from "@/services/httpClient";

function authHeader(accessToken: string): HeadersInit {
  return { Authorization: `Bearer ${accessToken}` };
}

function mapUser(dto: UserResponseDto): User {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    emailVerified: dto.emailVerified,
    createdAt: new Date(dto.createdAt),
  };
}

export async function getCurrentUser(accessToken: string): Promise<User> {
  const data = await requestJson<UserResponseDto>("/api/v1/users/me", {
    headers: authHeader(accessToken),
  });
  return mapUser(data);
}

export async function getCurrentProvider(accessToken: string): Promise<Provider> {
  const data = await requestJson<ProviderResponseDto>("/api/v1/providers/me", {
    headers: authHeader(accessToken),
  });
  return mapProvider(data);
}

export async function listProviders(accessToken: string): Promise<Provider[]> {
  const data = await requestJson<ProviderResponseDto[]>("/api/v1/providers", {
    headers: authHeader(accessToken),
  });
  return mapProviders(data);
}
