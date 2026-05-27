import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { getCurrentProvider } from "@/services/userService";

export function useCurrentProvider() {
  const { accessToken, role } = useAuth();
  return useQuery({
    queryKey: ["currentProvider", accessToken],
    queryFn: () => getCurrentProvider(accessToken),
    enabled: Boolean(accessToken) && role === "PROVIDER",
    staleTime: 5 * 60 * 1000,
  });
}
