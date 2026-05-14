import { useMutation } from '@tanstack/react-query'

import type { ForgotPasswordRequestDto } from '@/dto/auth'
import { forgotPassword } from '@/services/authService'

export function useForgotPasswordMutation() {
  return useMutation({
    mutationKey: ['auth', 'forgot-password'],
    mutationFn: (payload: ForgotPasswordRequestDto) => forgotPassword(payload),
  })
}
