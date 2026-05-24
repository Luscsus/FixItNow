import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/context/auth";
import {
  listSavedProviders,
  saveProvider,
  unsaveProvider,
} from "@/services/savedProviderService";

export function useSavedProvidersQuery() {
  const { accessToken, role } = useAuth();
  return useQuery({
    queryKey: ["savedProviders"],
    queryFn: () => listSavedProviders(accessToken),
    enabled: Boolean(accessToken) && role === "CUSTOMER",
    staleTime: 60 * 1000,
  });
}

export function useSavedProviderIds(): Set<string> {
  const { data } = useSavedProvidersQuery();
  return new Set((data ?? []).map((p) => p.id));
}

export function useToggleSavedProvider() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId, save }: { providerId: string; save: boolean }) => {
      if (save) await saveProvider(accessToken, providerId);
      else await unsaveProvider(accessToken, providerId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["savedProviders"] });
    },
  });
}
