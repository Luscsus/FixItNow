import { useMutation } from '@tanstack/react-query'

import { enableTwoFactor } from '@/services/twoFactorService'

type EnablePayload = {
  accessToken: string
  code: string
}

export function useTwoFactorEnableMutation() {
  return useMutation({
    mutationKey: ['user', '2fa', 'enable'],
    mutationFn: ({ accessToken, code }: EnablePayload) =>
      enableTwoFactor(accessToken, { code }),
  })
}
