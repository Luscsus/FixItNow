import { requestJson } from "@/services/httpClient";

export type TimeBlockType = "AVAILABLE" | "BREAK" | "OFF" | "BOOKED";

export interface TimeBlock {
  id: string;
  startAt: string;
  endAt: string;
  type: TimeBlockType;
  title?: string | null;
  notes?: string | null;
  ticketId?: number | null;
  seriesId?: string | null;
}

export type RecurrenceFrequency = "DAILY" | "WEEKLY";

export interface RecurrenceInput {
  frequency: RecurrenceFrequency;
  /** Total number of occurrences including the first one (2-12). */
  count: number;
}

export interface CreateTimeBlockResult {
  created: TimeBlock[];
  /** Start times of occurrences skipped because they overlapped an existing block. */
  skipped: string[];
}

export interface PublicTimeBlock {
  startAt: string;
  endAt: string;
  type: TimeBlockType;
  label: string;
}

export interface TimeBlockInput {
  startAt: string;
  endAt: string;
  type: TimeBlockType;
  title?: string | null;
  notes?: string | null;
  recurrence?: RecurrenceInput | null;
}

function authHeader(accessToken?: string): HeadersInit {
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

function buildRange(from: string, to: string): string {
  const params = new URLSearchParams({ from, to });
  return params.toString();
}

export async function getPublicCalendar(
  providerId: string,
  from: string,
  to: string,
): Promise<PublicTimeBlock[]> {
  return requestJson<PublicTimeBlock[]>(
    `/api/v1/providers/${providerId}/calendar?${buildRange(from, to)}`,
  );
}

export async function getOwnCalendar(
  from: string,
  to: string,
  accessToken?: string,
): Promise<TimeBlock[]> {
  return requestJson<TimeBlock[]>(
    `/api/v1/providers/me/calendar?${buildRange(from, to)}`,
    { headers: authHeader(accessToken) },
  );
}

export async function createTimeBlock(
  payload: TimeBlockInput,
  accessToken?: string,
): Promise<CreateTimeBlockResult> {
  return requestJson<CreateTimeBlockResult>("/api/v1/providers/me/calendar/blocks", {
    method: "POST",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function updateTimeBlock(
  blockId: string,
  payload: Partial<TimeBlockInput>,
  accessToken?: string,
): Promise<TimeBlock> {
  return requestJson<TimeBlock>(`/api/v1/providers/me/calendar/blocks/${blockId}`, {
    method: "PUT",
    headers: authHeader(accessToken),
    body: JSON.stringify(payload),
  });
}

export async function deleteTimeBlock(
  blockId: string,
  accessToken?: string,
): Promise<void> {
  await requestJson<{ message: string }>(
    `/api/v1/providers/me/calendar/blocks/${blockId}`,
    {
      method: "DELETE",
      headers: authHeader(accessToken),
    },
  );
}

export async function deleteTimeBlockSeries(
  seriesId: string,
  accessToken?: string,
): Promise<void> {
  await requestJson<{ message: string }>(
    `/api/v1/providers/me/calendar/blocks/series/${seriesId}`,
    {
      method: "DELETE",
      headers: authHeader(accessToken),
    },
  );
}
