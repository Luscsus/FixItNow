import { useMutation, useQueryClient } from "@tanstack/react-query";

import type { CreateTicketRequestDto } from "@/dto/ticket";
import { useAuth } from "@/context/auth";
import { createTicket } from "@/services/ticketService";

const TICKETS_KEY = ["tickets"];

export function useCreateTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationKey: ["tickets", "create"],
    mutationFn: (payload: CreateTicketRequestDto) => createTicket(payload, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}

