import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { releaseTicket } from "@/services/ticketService";

export function useReleaseTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) => releaseTicket(ticketId, accessToken),
    onSuccess: (_ticket, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
      queryClient.invalidateQueries({ queryKey: ["tickets", "provider"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", "open"] });
      queryClient.invalidateQueries({ queryKey: ["ownCalendar"] });
      queryClient.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}
