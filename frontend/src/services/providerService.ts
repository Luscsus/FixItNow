import { requestJson } from './httpClient'

// Full public provider profile (matches backend ProviderResponse). All optional
// because we don't always know which fields the backend populates.
export interface ProviderProfileDto {
  id: string
  firstName: string | null
  lastName: string | null
  phoneNumber: string | null
  pricePerHour: number | null
  yearsOfExperience: number | null
  serviceRadiusKm: number | null
  categories: string[] | null
  bio: string | null
  status: string | null
  createdAt: string | null
  approvedAt: string | null
}

export async function getProvider(providerId: string, accessToken: string): Promise<ProviderProfileDto> {
  return requestJson<ProviderProfileDto>(`/api/v1/providers/${providerId}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
}

export interface ProviderDto {
  id: string
  firstName: string
  lastName: string
  locationLat: number
  locationLon: number
  pricePerHour: number
  yearsOfExperience: number
  serviceRadiusKm: number
  categories: string[]
  bio: string
  status: string
  createdAt: string
  distanceKm: number | null
}

export interface ProviderSearchParams {
  categories: string[]
  minPrice: string
  maxPrice: string
  minYearsOfExperience: number
  latitude: number
  longitude: number
  radiusKm: number
  page: number
  size: number
}

export interface PagedProvidersResponse {
  content: ProviderDto[]
  totalPages: number
  totalElements: number
}

interface RawPagedResponse {
  content: ProviderDto[]
  totalPages: number
  totalElements: number
}

export async function searchProviders(params: URLSearchParams): Promise<ProviderDto[]> {
  const data = await requestJson<RawPagedResponse | ProviderDto[]>(
    `/api/v1/providers/search?${params}`,
  )
  return Array.isArray(data) ? data : (data.content ?? [])
}

export async function searchProvidersPaged(p: ProviderSearchParams): Promise<PagedProvidersResponse> {
  const sp = new URLSearchParams()
  p.categories.forEach((c) => sp.append('categories', c))
  sp.set('minPrice', p.minPrice || '1')
  sp.set('maxPrice', p.maxPrice || '99999')
  sp.set('minYearsOfExperience', String(p.minYearsOfExperience))
  sp.set('latitude', String(p.latitude))
  sp.set('longitude', String(p.longitude))
  sp.set('radiusKm', String(p.radiusKm))
  sp.set('page', String(p.page))
  sp.set('size', String(p.size))

  const data = await requestJson<RawPagedResponse | ProviderDto[]>(
    `/api/v1/providers/search?${sp}`,
  )
  if (Array.isArray(data)) {
    return { content: data, totalPages: 1, totalElements: data.length }
  }
  return data
}
