import type { TwoFactorSetupResponseDto } from '@/dto/twoFactor'
import type { TwoFactorSetup } from '@/domain/twoFactor'

export function mapTwoFactorSetup(dto: TwoFactorSetupResponseDto): TwoFactorSetup {
  return {
    secret: dto.secret ?? '',
    qrCodeUri: dto.qrCodeUri ?? '',
  }
}
