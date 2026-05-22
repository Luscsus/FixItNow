import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import {
  approveProvider,
  declineProvider,
  listPendingProviders,
} from "@/services/adminService";

const PENDING_PROVIDERS_KEY = ["admin", "providers", "pending"];

export function usePendingProviders() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: PENDING_PROVIDERS_KEY,
    queryFn: () => listPendingProviders(accessToken),
    enabled: !!accessToken,
  });
}

export function useApproveProviderMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => approveProvider(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PENDING_PROVIDERS_KEY }),
  });
}

export function useDeclineProviderMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      declineProvider(id, reason, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: PENDING_PROVIDERS_KEY }),
  });
}
