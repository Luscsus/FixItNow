import { useMutation } from '@tanstack/react-query'

import type { ResetPasswordRequestDto } from '@/dto/auth'
import { resetPassword } from '@/services/authService'

export function useResetPasswordMutation() {
  return useMutation({
    mutationKey: ['auth', 'reset-password'],
    mutationFn: (payload: ResetPasswordRequestDto) => resetPassword(payload),
  })
}
