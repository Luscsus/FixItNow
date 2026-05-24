import type { UserResponseDto } from "@/dto/user";
import type { ProviderResponseDto } from "@/dto/admin";
import type { User } from "@/domain/user";
import type { Provider, ServiceCategory } from "@/domain/admin";
import { mapProvider } from "@/mappers/adminMapper";
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
    notificationPreferences: dto.notificationPreferences ?? {},
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

export type UpdateUserProfilePayload = {
  firstName: string;
  lastName: string;
};

export async function updateCurrentUser(
  accessToken: string,
  payload: UpdateUserProfilePayload,
): Promise<User> {
  const data = await requestJson<UserResponseDto>("/api/v1/users/me", {
    method: "PATCH",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
  return mapUser(data);
}

export type UpdateProviderProfilePayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  locationLat: number;
  locationLon: number;
  pricePerHour: number;
  yearsOfExperience: number;
  serviceRadiusKm: number;
  categories: ServiceCategory[];
  bio: string | null;
};

export async function updateCurrentProvider(
  accessToken: string,
  payload: UpdateProviderProfilePayload,
): Promise<Provider> {
  const data = await requestJson<ProviderResponseDto>("/api/v1/providers/me", {
    method: "PATCH",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
  return mapProvider(data);
}

export async function changePassword(
  accessToken: string,
  payload: { currentPassword: string; newPassword: string },
): Promise<void> {
  await requestJson<{ message: string }>("/api/v1/users/me/password", {
    method: "PATCH",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function updateNotificationPreferences(
  accessToken: string,
  preferences: Record<string, boolean>,
): Promise<User> {
  const data = await requestJson<UserResponseDto>(
    "/api/v1/users/me/notification-preferences",
    {
      method: "PATCH",
      headers: authHeader(accessToken),
      body: JSON.stringify({ preferences }),
    },
  );
  return mapUser(data);
}
