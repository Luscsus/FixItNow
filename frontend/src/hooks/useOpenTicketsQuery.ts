import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { listOpenTickets } from "@/services/ticketService";

export function useOpenTicketsQuery() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["tickets", "open"],
    queryFn: () => listOpenTickets(accessToken),
    enabled: Boolean(accessToken),
  });
}
