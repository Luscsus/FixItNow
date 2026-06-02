import { requestJson } from "@/services/httpClient";

export interface AddressSuggestion {
  displayName: string;
  lat: number;
  lng: number;
}

/** Address autocomplete search (public endpoint). */
export async function searchAddresses(query: string, limit = 5): Promise<AddressSuggestion[]> {
  const q = query.trim();
  if (!q) return [];
  return requestJson<AddressSuggestion[]>(
    `/api/v1/geocode/search?q=${encodeURIComponent(q)}&limit=${limit}`,
  );
}
