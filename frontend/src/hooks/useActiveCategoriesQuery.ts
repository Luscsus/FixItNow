import { useQuery } from '@tanstack/react-query'
import { getActiveCategories } from '@/services/providerService'

export function useActiveCategoriesQuery() {
  return useQuery({
    queryKey: ['providers', 'categories'],
    queryFn: getActiveCategories,
    staleTime: 30 * 60 * 1000,
  })
}
