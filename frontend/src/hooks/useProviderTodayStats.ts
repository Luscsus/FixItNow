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
  /** Sum of invoiced amounts for all completed jobs (all-time). Null when no completed job has a cost set. */
  totalEarned: number | null;
  /** Total number of completed jobs (all-time). */
  completedJobs: number;
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

function billableMinutes(done: Date, t: Ticket): number {
  const start = workStartedAt(t);
  if (!start) return 0;
  const diff = (done.getTime() - start.getTime()) / 60000;
  return diff > 0 && diff < 24 * 60 ? diff : 0;
}

function calcAllTime(tickets: Ticket[]): { total: number; hasAnyCost: boolean; completedJobs: number } {
  let total = 0;
  let hasAnyCost = false;
  let completedJobs = 0;
  for (const t of tickets) {
    if (t.status !== "COMPLETED") continue;
    completedJobs += 1;
    if (t.estimatedCost != null) {
      total += t.estimatedCost;
      hasAnyCost = true;
    }
  }
  return { total, hasAnyCost, completedJobs };
}

function calcToday(tickets: Ticket[]): { earnings: number; jobs: number; minutes: number } {
  let earnings = 0;
  let jobs = 0;
  let minutes = 0;
  for (const t of tickets) {
    const done = completedAt(t);
    if (!done || !isToday(done)) continue;
    jobs += 1;
    earnings += t.estimatedCost ?? 0;
    minutes += billableMinutes(done, t);
  }
  return { earnings, jobs, minutes };
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
    const { earnings, jobs, minutes } = calcToday(tickets);
    const { total: allTimeTotal, hasAnyCost, completedJobs } = calcAllTime(tickets);

    return {
      earnings,
      jobs,
      hours: minutes / 60,
      totalEarned: hasAnyCost ? allTimeTotal : null,
      completedJobs,
      isProvider,
      isLoading: isProvider && isLoading,
      isError: isProvider && isError,
    };
  }, [tickets, isProvider, isLoading, isError]);
}
