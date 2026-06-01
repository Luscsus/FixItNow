import { requestJson } from "@/services/httpClient";
import type { TrackingSnapshot } from "@/domain/tracking";

/** Last-known live-tracking snapshot for a ticket (customer or assigned provider). */
export async function getTrackingSnapshot(
  ticketId: number,
  accessToken: string,
): Promise<TrackingSnapshot> {
  return requestJson<TrackingSnapshot>(`/api/tickets/${ticketId}/tracking`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
}
