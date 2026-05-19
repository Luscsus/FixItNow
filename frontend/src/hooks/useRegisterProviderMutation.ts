import { useMutation } from '@tanstack/react-query'

import type { ProviderRegisterRequestDto } from '@/dto/auth'
import { registerProvider } from '@/services/authService'

export function useRegisterProviderMutation() {
  return useMutation({
    mutationKey: ['auth', 'register', 'provider'],
    mutationFn: (payload: ProviderRegisterRequestDto) => registerProvider(payload),
  })
}
