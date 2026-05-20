import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import type { TicketStatus } from "@/domain/ticket";
import { updateTicketStatus } from "@/services/ticketService";

export function useUpdateTicketStatusMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tickets", "status"],
    mutationFn: ({ ticketId, status }: { ticketId: number; status: TicketStatus }) =>
      updateTicketStatus(ticketId, status, accessToken),
    onSuccess: (_ticket, variables) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", variables.ticketId] });
    },
  });
}

