export type AuthSession = {
  accessToken: string
  refreshToken: string
  tokenType: string
  requiresTwoFactor: boolean
  tempToken: string
}
