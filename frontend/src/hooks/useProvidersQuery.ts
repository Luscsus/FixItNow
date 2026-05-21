import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import { listProviders } from "@/services/userService";

export function useProvidersQuery() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["providers"],
    queryFn: () => listProviders(accessToken!),
    enabled: Boolean(accessToken),
  });
}
