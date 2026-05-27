export type ServiceCategory =
  | "PLUMBING"
  | "ELECTRICAL"
  | "CARPENTRY"
  | "PAINTING"
  | "CLEANING"
  | "GARDENING"
  | "MOVING"
  | "APPLIANCE_REPAIR"
  | "HVAC"
  | "ROOFING"
  | "LOCKSMITH"
  | "PEST_CONTROL"
  | "TUTORING"
  | "IT_SUPPORT"
  | "OTHER"

import type { UserRole } from "@/domain/auth"

export type ProviderStatus =
  | "PENDING_VERIFICATION"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED"

export type UserStatus = ProviderStatus

export type AdminUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: UserRole
  status: UserStatus
  emailVerified: boolean
  profilePictureUrl: string | null
  createdAt: Date
}

export type Provider = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  profilePictureUrl?: string | null
  status: ProviderStatus
  emailVerified: boolean
  locationStreetName: string | null
  locationStreetNumber: string | null
  locationCity: string | null
  locationPostalCode: string | null
  locationCountry: string | null
  locationLat: number | null
  locationLon: number | null
  pricePerHour: number | null
  yearsOfExperience: number | null
  serviceRadiusKm: number | null
  categories: ServiceCategory[]
  bio: string | null
  rejectionReason: string | null
  approvedAt: Date | null
  createdAt: Date
  notificationPreferences: Record<string, boolean>
  // Payout / bank — only populated when fetching own provider profile.
  bankAccountHolder: string | null
  bankIban: string | null
  bankBic: string | null
  bankName: string | null
}
