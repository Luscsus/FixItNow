import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { acceptTicket } from "@/services/ticketService";

export function useAcceptTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (ticketId: number) => acceptTicket(ticketId, accessToken),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    },
  });
}
