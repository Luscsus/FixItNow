export type JwtClaims = {
  sub?: string;
  role?: string;
  firstName?: string;
  lastName?: string;
  exp?: number;
  iat?: number;
};

export function decodeJwtPayload(token: string): JwtClaims {
  try {
    const base64 = token.split(".")[1];
    if (!base64) return {};
    const json = atob(base64.replace(/-/g, "+").replace(/_/g, "/"));
    return JSON.parse(json) as JwtClaims;
  } catch {
    return {};
  }
}

export function jwtUserInfo(token: string) {
  const claims = decodeJwtPayload(token);
  const firstName = claims.firstName ?? "";
  const lastName = claims.lastName ?? "";
  const fullName = [firstName, lastName].filter(Boolean).join(" ");
  const email = claims.sub ?? "";
  const initials = [firstName[0], lastName[0]].filter(Boolean).join("").toUpperCase() || email.slice(0, 2).toUpperCase();
  return { email, firstName, lastName, fullName, initials };
}

export function isTokenExpired(token: string, bufferMs: number = 60000): boolean {
  if (!token) return true;
  try {
    const claims = decodeJwtPayload(token);
    if (!claims.exp) return true;
    const expirationTime = claims.exp * 1000; // Convert from seconds to milliseconds
    const now = Date.now();
    return expirationTime - now <= bufferMs;
  } catch {
    return true;
  }
}

export function getTokenExpirationTime(token: string): number | null {
  try {
    const claims = decodeJwtPayload(token);
    if (!claims.exp) return null;
    return claims.exp * 1000; // Convert from seconds to milliseconds
  } catch {
    return null;
  }
}

