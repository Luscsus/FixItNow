import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { getTicket } from "@/services/ticketService";

export function useTicketQuery(ticketId: number) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["tickets", ticketId],
    queryFn: () => getTicket(ticketId, accessToken),
    enabled: Boolean(accessToken && ticketId),
  });
}

