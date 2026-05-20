import { useQuery } from "@tanstack/react-query";

import { getNearbyTickets } from "@/services/ticketService";

export function useNearbyTicketsQuery(latitude: number, longitude: number, radiusKm: number) {
  return useQuery({
    queryKey: ["tickets", "nearby", latitude, longitude, radiusKm],
    queryFn: () => getNearbyTickets(latitude, longitude, radiusKm),
    enabled: Number.isFinite(latitude) && Number.isFinite(longitude) && Number.isFinite(radiusKm),
  });
}

