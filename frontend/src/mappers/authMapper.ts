import type { AuthResponseDto } from '@/dto/auth'
import type { AuthSession, UserRole } from '@/domain/auth'

export function mapAuthResponse(dto: AuthResponseDto): AuthSession {
  return {
    accessToken: dto.accessToken ?? '',
    refreshToken: dto.refreshToken ?? '',
    tokenType: dto.tokenType ?? 'Bearer',
    role: (dto.role as UserRole) ?? 'USER',
    requiresTwoFactor: dto.requiresTwoFactor ?? false,
    tempToken: dto.tempToken ?? '',
  }
}
