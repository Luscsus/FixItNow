import { useMutation } from '@tanstack/react-query'

import { disableTwoFactor } from '@/services/twoFactorService'

type DisablePayload = {
  accessToken: string
  code: string
}

export function useTwoFactorDisableMutation() {
  return useMutation({
    mutationKey: ['user', '2fa', 'disable'],
    mutationFn: ({ accessToken, code }: DisablePayload) =>
      disableTwoFactor(accessToken, { code }),
  })
}
