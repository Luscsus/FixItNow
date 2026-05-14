import { useMutation } from '@tanstack/react-query'

import type { LoginRequestDto } from '@/dto/auth'
import { login } from '@/services/authService'

export function useLoginMutation() {
  return useMutation({
    mutationKey: ['auth', 'login'],
    mutationFn: (payload: LoginRequestDto) => login(payload),
  })
}
