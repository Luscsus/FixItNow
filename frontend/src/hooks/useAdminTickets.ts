import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import {
  adminDeleteTicket,
  adminUpdateTicket,
  listAllTickets,
} from "@/services/adminService";
import type { TicketPriority, TicketStatus } from "@/domain/ticket";

const TICKETS_KEY = ["admin", "tickets"];

export function useAdminTickets() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: TICKETS_KEY,
    queryFn: () => listAllTickets(accessToken),
    enabled: !!accessToken,
  });
}

export function useAdminUpdateTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      status,
      priority,
    }: {
      id: number;
      status?: TicketStatus;
      priority?: TicketPriority;
    }) => adminUpdateTicket(id, { status, priority }, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}

export function useAdminDeleteTicketMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => adminDeleteTicket(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: TICKETS_KEY }),
  });
}
