import { useMemo } from 'react';
import { useQuery, useMutation, useQueryClient, useQueries } from '@tanstack/react-query';
import { api } from '../services/api';
import { HouseholdCategory } from '../types';
import { useStorages } from './useStorages';

export interface CategoryGroup {
  storageId: string;
  storageName: string;
  storageEmoji: string;
  categories: HouseholdCategory[];
}

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

export function useHouseholdCategoryGroups(householdId: string | null) {
  const storages = useStorages(householdId);
  const storageList = storages.data ?? [];
  const categoryQueries = useQueries({
    queries: storageList.map((storage) => ({
      queryKey: ['categories', householdId, storage.id],
      queryFn: async () => {
        const response = await api.get<HouseholdCategory[]>(
          `/households/${householdId}/storages/${storage.id}/categories`,
        );
        return response.data;
      },
      enabled: !!householdId,
    })),
  });

  const data = useMemo<CategoryGroup[]>(() =>
    storageList.map((storage, index) => ({
      storageId: storage.id,
      storageName: storage.name,
      storageEmoji: storage.emoji,
      categories: categoryQueries[index]?.data ?? [],
    })),
  [storageList, categoryQueries]);

  return {
    data,
    isLoading: storages.isLoading || categoryQueries.some((query) => query.isLoading),
  };
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
