import type {
  AuthResponseDto,
  ForgotPasswordRequestDto,
  LoginRequestDto,
  ProviderRegisterRequestDto,
  RefreshTokenRequestDto,
  RegisterRequestDto,
  ResetPasswordRequestDto,
  TwoFactorVerifyRequestDto,
} from '@/dto/auth'
import type { MessageResponseDto } from '@/dto/message'
import type { AuthSession } from '@/domain/auth'
import type { Message } from '@/domain/message'
import { mapAuthResponse } from '@/mappers/authMapper'
import { mapMessageResponse } from '@/mappers/messageMapper'
import { requestJson } from '@/services/httpClient'

export async function confirmEmail(token: string): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    `/api/v1/auth/confirm-email?token=${encodeURIComponent(token)}`,
    { method: 'GET' },
  )

  return mapMessageResponse(data)
}

export async function register(payload: RegisterRequestDto): Promise<Message> {
  const data = await requestJson<MessageResponseDto>('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapMessageResponse(data)
}

export async function registerProvider(payload: ProviderRegisterRequestDto): Promise<Message> {
  const data = await requestJson<MessageResponseDto>('/api/v1/auth/register/provider', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapMessageResponse(data)
}

export async function login(payload: LoginRequestDto): Promise<AuthSession> {
  const data = await requestJson<AuthResponseDto>('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapAuthResponse(data)
}

export async function verifyTwoFactor(
  payload: TwoFactorVerifyRequestDto,
): Promise<AuthSession> {
  const data = await requestJson<AuthResponseDto>('/api/v1/auth/2fa/verify', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapAuthResponse(data)
}

export async function forgotPassword(
  payload: ForgotPasswordRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    '/api/v1/auth/forgot-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return mapMessageResponse(data)
}

export async function resendEmailConfirmation(
  payload: ForgotPasswordRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    '/api/v1/auth/resend-confirmation',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return mapMessageResponse(data)
}

export async function resetPassword(
  payload: ResetPasswordRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>(
    '/api/v1/auth/reset-password',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  )

  return mapMessageResponse(data)
}

export async function refreshToken(
  payload: RefreshTokenRequestDto,
): Promise<AuthSession> {
  const data = await requestJson<AuthResponseDto>('/api/v1/auth/refresh', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapAuthResponse(data)
}

export async function logout(
  payload: RefreshTokenRequestDto,
): Promise<Message> {
  const data = await requestJson<MessageResponseDto>('/api/v1/auth/logout', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

  return mapMessageResponse(data)
}
