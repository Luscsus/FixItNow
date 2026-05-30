import { useQuery } from "@tanstack/react-query";
import { getPublicStats } from "@/services/publicStatsService";

export function usePublicStatsQuery() {
  return useQuery({
    queryKey: ["publicStats"],
    queryFn: getPublicStats,
    // Numbers move slowly — landing page doesn't need fresh-by-the-second data.
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
