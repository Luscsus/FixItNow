import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { getMatchingOpenTickets } from "@/services/ticketService";

/**
 * Open tickets matching the logged-in provider's trades + service radius,
 * nearest first. Only runs for authenticated providers; refetches on a gentle
 * interval so the "incoming jobs" widget stays current.
 */
export function useMatchingOpenTicketsQuery() {
  const { accessToken, role } = useAuth();
  return useQuery({
    queryKey: ["tickets", "open", "matching"],
    queryFn: () => getMatchingOpenTickets(accessToken),
    enabled: Boolean(accessToken) && role === "PROVIDER",
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
}
