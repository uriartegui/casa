import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { HouseholdCategory } from '../types';

export function useCategories(householdId: string | null, storageId: string | null) {
  return useQuery({
    queryKey: ['categories', householdId, storageId],
    queryFn: async () => {
      const response = await api.get<HouseholdCategory[]>(
        `/households/${householdId}/storages/${storageId}/categories`,
      );
      return response.data;
    },
    enabled: !!householdId && !!storageId,
  });
}

export function useCreateCategory(householdId: string, storageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { label: string; emoji: string }) => {
      const response = await api.post<HouseholdCategory>(
        `/households/${householdId}/storages/${storageId}/categories`,
        payload,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', householdId, storageId] });
    },
  });
}

export function useDeleteCategory(householdId: string, storageId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (categoryId: string) => {
      await api.delete(`/households/${householdId}/categories/${categoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories', householdId, storageId] });
    },
  });
}
