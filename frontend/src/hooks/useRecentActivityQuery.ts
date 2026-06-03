import { useQuery } from "@tanstack/react-query";
import { getRecentActivity } from "@/services/publicStatsService";

/**
 * Recent anonymized platform-wide activity for the public landing feed.
 * Polls on an interval so the feed feels live.
 */
export function useRecentActivityQuery(limit = 6) {
  return useQuery({
    queryKey: ["publicRecentActivity", limit],
    queryFn: () => getRecentActivity(limit),
    staleTime: 60 * 1000,
    refetchInterval: 60 * 1000,
    refetchOnWindowFocus: true,
  });
}
