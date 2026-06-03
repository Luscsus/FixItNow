import { useQuery } from "@tanstack/react-query";
import { getPublicStats } from "@/services/publicStatsService";

export function usePublicStatsQuery() {
  return useQuery({
    queryKey: ["publicStats"],
    queryFn: getPublicStats,
    // Marketplace numbers move slowly, but the homepage "live" cards should
    // reflect new completed jobs without a manual reload — refetch on a gentle
    // interval and whenever the tab regains focus.
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // poll every minute for live-ish updates
    refetchOnWindowFocus: true,
  });
}
