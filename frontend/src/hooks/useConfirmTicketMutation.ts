import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { confirmTicket, declineTicket } from "@/services/ticketService";

export function useConfirmTicketMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => confirmTicket(ticketId, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", "provider"] });
      qc.invalidateQueries({ queryKey: ["ownCalendar"] });
      qc.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}

export function useDeclineTicketMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ticketId: number) => declineTicket(ticketId, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tickets", "provider"] });
    },
  });
}
