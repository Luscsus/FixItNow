import { useQuery } from '@tanstack/react-query'
import { getProviderById } from '@/services/providerService'

export function useProviderByIdQuery(id: string) {
  return useQuery({
    queryKey: ['providers', id],
    queryFn: () => getProviderById(id),
    enabled: !!id,
  })
}
