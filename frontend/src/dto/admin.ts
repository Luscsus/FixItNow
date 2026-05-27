import type { TicketStatusDto, TicketPriorityDto } from "@/dto/ticket"

export type ProviderResponseDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  profilePictureUrl?: string | null
  status: string
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
  categories: string[]
  bio: string | null
  rejectionReason: string | null
  approvedAt: string | null
  createdAt: string
  notificationPreferences?: Record<string, boolean> | null
}

export type DeclineProviderRequestDto = {
  reason: string
}

export type UserSummaryResponseDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  status: string
  emailVerified: boolean
  profilePictureUrl?: string | null
  createdAt: string
  notificationPreferences?: Record<string, boolean> | null
}

export type ChangeUserRoleRequestDto = {
  role: "CUSTOMER" | "ADMIN"
}

export type AdminUpdateTicketRequestDto = {
  status?: TicketStatusDto | null
  priority?: TicketPriorityDto | null
}
