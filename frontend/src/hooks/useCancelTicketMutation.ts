import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { cancelTicket } from "@/services/ticketService";

export function useCancelTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) => cancelTicket(ticketId, accessToken),
    onSuccess: (_ticket, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
    },
  });
}
