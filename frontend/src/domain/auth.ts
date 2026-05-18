export type UserRole = "USER" | "CUSTOMER" | "PROVIDER" | "ADMIN";

export type AuthSession = {
  accessToken: string
  refreshToken: string
  tokenType: string
  role: UserRole
  requiresTwoFactor: boolean
  tempToken: string
}
