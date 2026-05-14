import type { EnableTwoFactorRequestDto } from '@/dto/twoFactor'
import type { TwoFactorSetupResponseDto, TwoFactorVerifyRequestDto } from '@/dto/twoFactor'
import type { Message } from '@/domain/message'
import type { TwoFactorSetup } from '@/domain/twoFactor'
import { mapMessageResponse } from '@/mappers/messageMapper'
import { mapTwoFactorSetup } from '@/mappers/twoFactorMapper'
import { requestJson } from '@/services/httpClient'
import type { MessageResponseDto } from '@/dto/message'

function authHeaders(accessToken: string) {
  return {
    Authorization: `Bearer ${accessToken}`,
  }
}

export async function setupTwoFactor(accessToken: string): Promise<TwoFactorSetup> {
  const data = await requestJson<TwoFactorSetupResponseDto>(
    '/api/v1/user/2fa/setup',
    {
      method: 'POST',
      headers: authHeaders(accessToken),
    },
  )

  return mapTwoFactorSetup(data)
}

export async function enableTwoFactor(
  accessToken: string,
  payload: EnableTwoFactorRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    '/api/v1/user/2fa/enable',
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  )

  return mapMessageResponse(data)
}

export async function disableTwoFactor(
  accessToken: string,
  payload: TwoFactorVerifyRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    '/api/v1/user/2fa/disable',
    {
      method: 'POST',
      headers: authHeaders(accessToken),
      body: JSON.stringify(payload),
    },
  )

  return mapMessageResponse(data)
}
