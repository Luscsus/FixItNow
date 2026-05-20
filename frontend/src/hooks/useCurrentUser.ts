import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { getCurrentUser } from "@/services/userService";

export function useCurrentUser() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: ["currentUser", accessToken],
    queryFn: () => getCurrentUser(accessToken),
    enabled: Boolean(accessToken),
    staleTime: 5 * 60 * 1000,
  });
}
