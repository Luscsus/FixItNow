import { requestJson } from "@/services/httpClient";
import type {
  CreateReviewPayload,
  ProviderRatingStats,
  Review,
} from "@/domain/review";

function authHeader(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export async function listProviderReviews(providerId: string): Promise<Review[]> {
  return requestJson<Review[]>(`/api/v1/providers/${providerId}/reviews`);
}

export async function getProviderRatingStats(
  providerId: string,
): Promise<ProviderRatingStats> {
  return requestJson<ProviderRatingStats>(
    `/api/v1/providers/${providerId}/reviews/stats`,
  );
}

/** Create or update the current customer's review for a provider. */
export async function upsertReview(
  providerId: string,
  payload: CreateReviewPayload,
  accessToken: string,
): Promise<Review> {
  return requestJson<Review>(`/api/v1/providers/${providerId}/reviews`, {
    method: "POST",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function deleteOwnReview(
  providerId: string,
  accessToken: string,
): Promise<void> {
  await requestJson<{ message: string }>(
    `/api/v1/providers/${providerId}/reviews`,
    { method: "DELETE", headers: authHeader(accessToken) },
  );
}
