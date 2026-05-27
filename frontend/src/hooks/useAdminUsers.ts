import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/auth";
import {
  changeUserRole,
  deleteUser,
  listAllUsers,
  reactivateUser,
  suspendUser,
} from "@/services/adminService";
import type { UserRole } from "@/domain/auth";

const USERS_KEY = ["admin", "users"];

export function useAdminUsers() {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => listAllUsers(accessToken),
    enabled: !!accessToken,
  });
}

export function useChangeUserRoleMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, role }: { id: string; role: Exclude<UserRole, "PROVIDER"> }) =>
      changeUserRole(id, role, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useSuspendUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => suspendUser(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useReactivateUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => reactivateUser(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}

export function useDeleteUserMutation() {
  const { accessToken } = useAuth();
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteUser(id, accessToken),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: USERS_KEY }),
  });
}
