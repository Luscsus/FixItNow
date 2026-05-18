import { useMutation } from '@tanstack/react-query'

import type { RegisterRequestDto } from '@/dto/auth'
import { registerCustomer } from '@/services/authService'

export function useRegisterCustomerMutation() {
  return useMutation({
    mutationKey: ['auth', 'register', 'customer'],
    mutationFn: (payload: RegisterRequestDto) => registerCustomer(payload),
  })
}
