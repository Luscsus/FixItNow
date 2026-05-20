import { useQuery } from '@tanstack/react-query'

import { searchProviders } from '@/services/providerService'

const ALL_PROVIDERS_PARAMS = new URLSearchParams({
  minPrice: '1',
  maxPrice: '999999',
  minYearsOfExperience: '0',
  latitude: '0',
  longitude: '0',
  radiusKm: '20020',
  page: '0',
  size: '1000',
})

export function useAllProvidersQuery() {
  return useQuery({
    queryKey: ['providers', 'all'],
    queryFn: () => searchProviders(ALL_PROVIDERS_PARAMS),
  })
}
