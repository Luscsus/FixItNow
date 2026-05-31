import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getOwnCalendar,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
  deleteTimeBlockSeries,
  type TimeBlockInput,
} from "@/services/calendarService";
import { useAuth } from "@/context/auth";

const KEY = "ownCalendar";

export function useOwnCalendarQuery(from: string, to: string, enabled = true) {
  const { accessToken } = useAuth();
  return useQuery({
    queryKey: [KEY, from, to, accessToken],
    queryFn: () => getOwnCalendar(from, to, accessToken),
    enabled: Boolean(accessToken) && enabled,
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

export function useDeleteTimeBlockSeriesMutation() {
  const { accessToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (seriesId: string) => deleteTimeBlockSeries(seriesId, accessToken),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: ["providerCalendar"] });
    },
  });
}
