import { useMemo } from "react";
import { useAuth } from "@/context/auth";
import { useProviderTicketsQuery } from "@/hooks/useProviderTicketsQuery";
import type { Ticket } from "@/domain/ticket";

export interface ProviderTodayStats {
  /** Sum of invoiced amounts for jobs completed today. */
  earnings: number;
  /** Number of jobs the provider completed today. */
  jobs: number;
  /** Hours worked today, derived from dispatch → completion spans of today's jobs. */
  hours: number;
  isProvider: boolean;
  isLoading: boolean;
  isError: boolean;
}

function isToday(d: Date): boolean {
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

/** When did this ticket transition to COMPLETED? Null if it hasn't. */
function completedAt(t: Ticket): Date | null {
  const hist = t.statusHistory ?? [];
  const match = [...hist].reverse().find((h) => h.status === "COMPLETED");
  return match?.changedAt ?? null;
}

/**
 * When did work effectively start? We treat the first IN_TRANSIT (provider
 * dispatched) as the start of billable time, falling back to APPROVED, then to
 * the ticket's creation. Used to estimate hours worked from real timestamps.
 */
function workStartedAt(t: Ticket): Date | null {
  const hist = t.statusHistory ?? [];
  const inTransit = hist.find((h) => h.status === "IN_TRANSIT");
  if (inTransit) return inTransit.changedAt;
  const approved = hist.find((h) => h.status === "APPROVED");
  if (approved) return approved.changedAt;
  return t.createdAt ?? null;
}

/**
 * Today's earnings / jobs / hours for the logged-in provider, derived from
 * their own tickets (the underlying query is PROVIDER-scoped and secured, and
 * is invalidated whenever a job status or payment changes — so these numbers
 * update automatically).
 */
export function useProviderTodayStats(): ProviderTodayStats {
  const { role } = useAuth();
  const isProvider = role === "PROVIDER";
  const { data: tickets = [], isLoading, isError } = useProviderTicketsQuery();

  return useMemo(() => {
    let earnings = 0;
    let jobs = 0;
    let minutes = 0;

    for (const t of tickets) {
      const done = completedAt(t);
      if (!done || !isToday(done)) continue;
      jobs += 1;
      earnings += t.estimatedCost ?? 0;
      const start = workStartedAt(t);
      if (start) {
        const diffMin = (done.getTime() - start.getTime()) / 60000;
        // Guard against clock skew / multi-day spans dominating the figure.
        if (diffMin > 0 && diffMin < 24 * 60) minutes += diffMin;
      }
    }

    return {
      earnings,
      jobs,
      hours: minutes / 60,
      isProvider,
      isLoading: isProvider && isLoading,
      isError: isProvider && isError,
    };
  }, [tickets, isProvider, isLoading, isError]);
}
