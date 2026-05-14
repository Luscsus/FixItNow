import type { AuthResponseDto } from '@/dto/auth'
import type { AuthSession } from '@/domain/auth'

export function mapAuthResponse(dto: AuthResponseDto): AuthSession {
  return {
    accessToken: dto.accessToken ?? '',
    refreshToken: dto.refreshToken ?? '',
    tokenType: dto.tokenType ?? 'Bearer',
    requiresTwoFactor: dto.requiresTwoFactor ?? false,
    tempToken: dto.tempToken ?? '',
  }
}
