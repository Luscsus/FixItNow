import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { listTickets } from "@/services/ticketService";

export function useTicketsQuery() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["tickets"],
    queryFn: () => listTickets(accessToken),
    enabled: Boolean(accessToken),
  });
}

