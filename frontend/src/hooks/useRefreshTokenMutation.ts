import { useMutation } from '@tanstack/react-query'

import type { RefreshTokenRequestDto } from '@/dto/auth'
import { refreshToken } from '@/services/authService'

export function useRefreshTokenMutation() {
  return useMutation({
    mutationKey: ['auth', 'refresh'],
    mutationFn: (payload: RefreshTokenRequestDto) => refreshToken(payload),
  })
}
