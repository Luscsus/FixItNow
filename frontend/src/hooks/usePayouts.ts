import { useMemo } from "react";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import type { Ticket, TicketStatus } from "@/domain/ticket";

export type PayoutStatus = "Completed" | "Pending" | "Processing" | "Failed";

export interface Payout {
  id: number;
  reference: string;
  amount: number;
  date: Date;
  status: PayoutStatus;
}

// Map a ticket's lifecycle status to a payout status.
export function toPayoutStatus(s: TicketStatus): PayoutStatus {
  switch (s) {
    case "COMPLETED": return "Completed";
    case "PENDING_PAYMENT": return "Pending";
    case "CANCELLED": return "Failed";
    default: return "Processing";
  }
}

// The date the payout reached its current state (status-history entry), else creation.
function payoutDate(t: Ticket): Date {
  const hist = t.statusHistory ?? [];
  const match = [...hist].reverse().find((h) => h.status === t.status);
  return match?.changedAt ?? t.createdAt;
}

/**
 * Derives the authenticated provider's payouts from their own tickets.
 * The underlying query (`/api/tickets/provider`) is PROVIDER-role gated and
 * scoped to the current user, so this only ever exposes the provider's own data.
 */
export function usePayouts() {
  const { data: tickets = [], isLoading, isError, refetch, isFetching } = useProviderTicketsQuery();

  const payouts = useMemo<Payout[]>(() => {
    return tickets
      // A payout exists once there's an amount, or the job is complete.
      .filter((tk) => tk.estimatedCost != null || tk.status === "COMPLETED")
      .map((tk) => ({
        id: tk.id,
        reference: `FIX-${String(tk.id).padStart(4, "0")}`,
        amount: tk.estimatedCost ?? 0,
        date: payoutDate(tk),
        status: toPayoutStatus(tk.status),
      }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());
  }, [tickets]);

  const totalPaid = useMemo(
    () => payouts.filter((p) => p.status === "Completed").reduce((sum, p) => sum + p.amount, 0),
    [payouts],
  );
  const pendingTotal = useMemo(
    () => payouts.filter((p) => p.status === "Pending").reduce((sum, p) => sum + p.amount, 0),
    [payouts],
  );

  return { payouts, totalPaid, pendingTotal, isLoading, isError, refetch, isFetching };
}
