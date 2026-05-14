import { useQuery } from '@tanstack/react-query'

import { confirmEmail } from '@/services/authService'

export function useConfirmEmailQuery(token: string) {
  return useQuery({
    queryKey: ['auth', 'confirm-email', token],
    queryFn: () => confirmEmail(token),
    enabled: false,
    retry: false,
  })
}
