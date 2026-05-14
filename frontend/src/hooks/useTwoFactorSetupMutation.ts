import { useMutation } from '@tanstack/react-query'

import { setupTwoFactor } from '@/services/twoFactorService'

export function useTwoFactorSetupMutation() {
  return useMutation({
    mutationKey: ['user', '2fa', 'setup'],
    mutationFn: (accessToken: string) => setupTwoFactor(accessToken),
  })
}
