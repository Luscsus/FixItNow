import { useMutation } from '@tanstack/react-query'

import type { ForgotPasswordRequestDto } from '@/dto/auth'
import { resendEmailConfirmation } from '@/services/authService'

export function useResendEmailConfirmationMutation() {
  return useMutation({
    mutationKey: ['auth', 'resend-confirmation'],
    mutationFn: (payload: ForgotPasswordRequestDto) =>
      resendEmailConfirmation(payload),
  })
}
