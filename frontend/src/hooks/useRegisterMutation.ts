import { useMutation } from '@tanstack/react-query'

import type { RegisterRequestDto } from '@/dto/auth'
import { register } from '@/services/authService'

export function useRegisterMutation() {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: (payload: RegisterRequestDto) => register(payload),
  })
}
