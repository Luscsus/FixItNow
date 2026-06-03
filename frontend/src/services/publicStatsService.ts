import { requestJson } from "@/services/httpClient";
import type { RecentActivityDto } from "@/dto/ticket";

export interface PublicStats {
  completedTicketsToday: number;
  completedTicketsLast30Days: number;
  completedTicketsAllTime: number;
  /** Mean rating across all reviews; null when there are no reviews yet. */
  averageRating: number | null;
  reviewCount: number;
  activeProvidersCount: number;
  citiesServedCount: number;
  /** 0.0–1.0, or null when no completed tickets exist yet. */
  sameDayFixRate: number | null;
  /** Median minutes from creation to first APPROVED; null when no approvals yet. */
  medianResponseMinutes: number | null;
  /** Mean advertised hourly rate across active providers; null when none set. */
  averageHourlyRate: number | null;
  /** Marketplace commission percentage, from server configuration. */
  platformFeePercent: number;
}

export async function getPublicStats(): Promise<PublicStats> {
  return requestJson<PublicStats>("/api/v1/public/stats");
}

export async function getRecentActivity(limit = 6): Promise<RecentActivityDto[]> {
  return requestJson<RecentActivityDto[]>(`/api/v1/public/stats/recent-activity?limit=${limit}`);
}
