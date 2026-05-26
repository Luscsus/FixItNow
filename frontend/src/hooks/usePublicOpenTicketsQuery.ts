import { useQuery } from "@tanstack/react-query";
import { getPublicOpenTickets } from "@/services/ticketService";

export function usePublicOpenTicketsQuery() {
  return useQuery({
    queryKey: ["tickets", "public", "open"],
    queryFn: getPublicOpenTickets,
  });
}
