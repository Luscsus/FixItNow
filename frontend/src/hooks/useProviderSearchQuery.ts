import { useQuery } from '@tanstack/react-query'

import { searchProvidersPaged, type ProviderSearchParams } from '@/services/providerService'

export function useProviderSearchQuery(params: ProviderSearchParams) {
  return useQuery({
    queryKey: ['providers', 'search', params],
    queryFn: () => searchProvidersPaged(params),
  })
}
