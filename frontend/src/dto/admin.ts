export type ProviderResponseDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  phoneNumber: string | null
  status: string
  emailVerified: boolean
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
}

export type DeclineProviderRequestDto = {
  reason: string
}
