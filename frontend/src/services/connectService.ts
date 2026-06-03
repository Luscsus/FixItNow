import { requestJson } from "@/services/httpClient";

function authHeader(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export type ConnectStatus = {
  /** A connected Stripe account exists for this provider. */
  connected: boolean;
  /** The account can accept charges (onboarding complete). */
  chargesEnabled: boolean;
  /** The account can receive payouts to its bank. */
  payoutsEnabled: boolean;
};

/** Current Stripe Connect onboarding state (from cached flags). */
export async function getConnectStatus(accessToken?: string): Promise<ConnectStatus> {
  return requestJson<ConnectStatus>("/api/connect/status", { headers: authHeader(accessToken) });
}

/** Forces a refresh from Stripe — used when returning from the onboarding flow. */
export async function refreshConnectStatus(accessToken?: string): Promise<ConnectStatus> {
  return requestJson<ConnectStatus>("/api/connect/refresh", {
    method: "POST",
    headers: authHeader(accessToken),
  });
}

/** Starts (or resumes) Stripe-hosted onboarding; returns the redirect URL. */
export async function startConnectOnboarding(accessToken?: string): Promise<string> {
  const data = await requestJson<{ url: string }>("/api/connect/onboarding-link", {
    method: "POST",
    headers: authHeader(accessToken),
  });
  return data.url;
}
