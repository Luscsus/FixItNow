export type TwoFactorSetupResponseDto = {
  secret?: string
  qrCodeUri?: string
}

export type EnableTwoFactorRequestDto = {
  code: string
}

export type TwoFactorVerifyRequestDto = {
  tempToken?: string
  code: string
}
