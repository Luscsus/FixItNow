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

export type ProviderStatus =
  | "PENDING_VERIFICATION"
  | "PENDING_APPROVAL"
  | "REJECTED"
  | "ACTIVE"
  | "SUSPENDED"
  | "DELETED"

export type Provider = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  status: ProviderStatus
  emailVerified: boolean
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
}
