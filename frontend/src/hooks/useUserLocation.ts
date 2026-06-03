import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import {
  updateUserLocation,
  deleteUserLocation,
  type UpdateUserLocationPayload,
} from "@/services/userService";

/** Shared read/save/remove of the current user's default location. */
export function useUserLocation() {
  const { accessToken } = useAuth();
  const { data: user } = useCurrentUser();
  const queryClient = useQueryClient();

  const saved = user?.location ?? null;

  const saveMutation = useMutation({
    mutationFn: (payload: UpdateUserLocationPayload) => updateUserLocation(accessToken, payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  });

  const removeMutation = useMutation({
    mutationFn: () => deleteUserLocation(accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["currentUser"] }),
  });

  return { saved, saveMutation, removeMutation };
}
