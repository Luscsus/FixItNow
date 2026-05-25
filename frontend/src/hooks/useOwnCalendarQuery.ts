import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOwnCalendar,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  type TimeBlockInput,
} from "@/services/calendarService";
import { useAuth } from "@/context/auth";

const KEY = "ownCalendar";

export function useOwnCalendarQuery(from: string, to: string) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: [KEY, from, to, accessToken],
    queryFn: () => getOwnCalendar(from, to, accessToken),
    enabled: Boolean(accessToken),
  });
}

export function useCreateTimeBlockMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: TimeBlockInput) => createTimeBlock(payload, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}

export function useUpdateTimeBlockMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<TimeBlockInput> }) =>
      updateTimeBlock(id, payload, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}

export function useDeleteTimeBlockMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteTimeBlock(id, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}
