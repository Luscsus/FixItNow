import type { ProviderResponseDto, UserSummaryResponseDto } from "@/dto/admin";
import type { AdminUser, Provider, ProviderStatus, ServiceCategory, UserStatus } from "@/domain/admin";
import type { UserRole } from "@/domain/auth";

export function mapProvider(dto: ProviderResponseDto): Provider {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    phoneNumber: dto.phoneNumber,
    profilePictureUrl: dto.profilePictureUrl ?? null,
    status: dto.status as ProviderStatus,
    emailVerified: dto.emailVerified,
    locationStreetName: dto.locationStreetName,
    locationStreetNumber: dto.locationStreetNumber,
    locationCity: dto.locationCity,
    locationPostalCode: dto.locationPostalCode,
    locationCountry: dto.locationCountry,
    locationLat: dto.locationLat,
    locationLon: dto.locationLon,
    pricePerHour: dto.pricePerHour,
    yearsOfExperience: dto.yearsOfExperience,
    serviceRadiusKm: dto.serviceRadiusKm,
    categories: (dto.categories ?? []) as ServiceCategory[],
    bio: dto.bio,
    rejectionReason: dto.rejectionReason,
    approvedAt: dto.approvedAt ? new Date(dto.approvedAt) : null,
    createdAt: new Date(dto.createdAt),
    notificationPreferences: dto.notificationPreferences ?? {},
  };
}

export function mapProviders(dtos: ProviderResponseDto[]): Provider[] {
  return dtos.map(mapProvider);
}

export function mapUser(dto: UserSummaryResponseDto): AdminUser {
  return {
    id: dto.id,
    email: dto.email,
    firstName: dto.firstName,
    lastName: dto.lastName,
    role: dto.role as UserRole,
    status: dto.status as UserStatus,
    emailVerified: dto.emailVerified,
    profilePictureUrl: dto.profilePictureUrl ?? null,
    createdAt: new Date(dto.createdAt),
  };
}

export function mapUsers(dtos: UserSummaryResponseDto[]): AdminUser[] {
  return dtos.map(mapUser);
}
