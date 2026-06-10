import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { markPaymentReceived } from "@/services/ticketService";

export function useMarkPaymentReceivedMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tickets", "payment-received"],
    mutationFn: (ticketId: number) => markPaymentReceived(ticketId, accessToken),
    onSuccess: (_ticket, ticketId) => {
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      queryClient.invalidateQueries({ queryKey: ["tickets", ticketId] });
    },
  });
}
