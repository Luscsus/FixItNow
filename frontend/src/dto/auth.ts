export type AuthResponseDto = {
  accessToken?: string
  refreshToken?: string
  tokenType?: string
  requiresTwoFactor?: boolean
  tempToken?: string
}

export type LoginRequestDto = {
  email: string
  password: string
}

export type RegisterRequestDto = {
  email: string
  password: string
  firstName: string
  lastName: string
}

export type ForgotPasswordRequestDto = {
  email: string
}

export type ResetPasswordRequestDto = {
  token: string
  newPassword: string
}

export type RefreshTokenRequestDto = {
  refreshToken: string
}

export type TwoFactorVerifyRequestDto = {
  tempToken: string
  code: string
}
