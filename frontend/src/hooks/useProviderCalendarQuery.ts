import { useQuery } from "@tanstack/react-query";
import { getPublicCalendar } from "@/services/calendarService";

export function useProviderCalendarQuery(
  providerId: string | undefined,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["providerCalendar", providerId, from, to],
    queryFn: () => getPublicCalendar(providerId!, from, to),
    enabled: Boolean(providerId),
  });
}
