import { requestJson } from './httpClient'

export interface ProviderDto {
  id: string
  firstName: string
  lastName: string
  locationStreetName: string | null
  locationStreetNumber: string | null
  locationCity: string | null
  locationPostalCode: string | null
  locationCountry: string | null
  locationLat: number | null
  locationLon: number | null
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
  latitude: number | null
  longitude: number | null
  radiusKm: number | null
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
  totalPages?: number
  totalElements?: number
  page?: {
    size: number
    number: number
    totalElements: number
    totalPages: number
  }
}

export async function getActiveCategories(): Promise<string[]> {
  return requestJson<string[]>('/api/v1/providers/categories')
}

export async function getProviderById(id: string): Promise<ProviderDto> {
  return requestJson<ProviderDto>(`/api/v1/providers/${id}`)
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
  if (p.latitude != null) sp.set('latitude', String(p.latitude))
  if (p.longitude != null) sp.set('longitude', String(p.longitude))
  if (p.radiusKm != null) sp.set('radiusKm', String(p.radiusKm))
  sp.set('page', String(p.page))
  sp.set('size', String(p.size))

  const data = await requestJson<RawPagedResponse | ProviderDto[]>(
    `/api/v1/providers/search?${sp}`,
  )
  if (Array.isArray(data)) {
    return { content: data, totalPages: 1, totalElements: data.length }
  }
  return {
    content: data.content ?? [],
    totalPages: data.page?.totalPages ?? data.totalPages ?? 1,
    totalElements: data.page?.totalElements ?? data.totalElements ?? 0,
  }
}
