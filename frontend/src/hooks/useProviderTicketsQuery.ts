import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { listProviderTickets } from "@/services/ticketService";

export function useProviderTicketsQuery() {
  const { accessToken, role } = useAuth();
  return useQuery({
    queryKey: ["tickets", "provider"],
    queryFn: () => listProviderTickets(accessToken),
    enabled: Boolean(accessToken) && role === "PROVIDER",
  });
}
