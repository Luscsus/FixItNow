import { useMutation } from '@tanstack/react-query'

import type { RefreshTokenRequestDto } from '@/dto/auth'
import { logout } from '@/services/authService'

export function useLogoutMutation() {
  return useMutation({
    mutationKey: ['auth', 'logout'],
    mutationFn: (payload: RefreshTokenRequestDto) => logout(payload),
  })
}
