import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Storage } from '../types';

export function useStorages(householdId: string | null) {
  return useQuery({
    queryKey: ['storages', householdId],
    queryFn: async () => {
      const response = await api.get<Storage[]>(`/households/${householdId}/storages`);
      return response.data;
    },
    enabled: !!householdId,
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
