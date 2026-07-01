import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Storage } from '../types';

const STORAGE_STALE_TIME = 5 * 60 * 1000;

export function useStorages(householdId: string | null, options?: { includeHidden?: boolean }) {
  const includeHidden = options?.includeHidden ?? false;
  return useQuery({
    queryKey: ['storages', householdId, includeHidden],
    queryFn: async () => {
      const params = includeHidden ? '?includeHidden=true' : '';
      const response = await api.get<Storage[]>(`/households/${householdId}/storages${params}`);
      return response.data;
    },
    enabled: !!householdId,
    staleTime: STORAGE_STALE_TIME,
    refetchOnMount: 'always',
  });
}

interface CreateStoragePayload {
  name: string;
  emoji?: string;
}

export function useCreateStorage(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateStoragePayload) => {
      const response = await api.post<Storage>(
        `/households/${householdId}/storages`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storages', householdId] });
    },
  });
}

export function useDeleteStorage(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (storageId: string) => {
      await api.delete(`/households/${householdId}/storages/${storageId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storages', householdId] });
    },
  });
}

interface UpdateStoragePayload {
  storageId: string;
  name?: string;
  emoji?: string;
  hidden?: boolean;
}

export function useUpdateStorage(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ storageId, ...body }: UpdateStoragePayload) => {
      const response = await api.patch<Storage>(
        `/households/${householdId}/storages/${storageId}`,
        body,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storages', householdId] });
    },
  });
}
