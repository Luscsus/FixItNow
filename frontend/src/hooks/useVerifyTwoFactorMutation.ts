import { useMutation } from '@tanstack/react-query'

import type { TwoFactorVerifyRequestDto } from '@/dto/auth'
import { verifyTwoFactor } from '@/services/authService'

export function useVerifyTwoFactorMutation() {
  return useMutation({
    mutationKey: ['auth', '2fa', 'verify'],
    mutationFn: (payload: TwoFactorVerifyRequestDto) => verifyTwoFactor(payload),
  })
}
