import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FridgeItem } from '../types';

export function useFridge(householdId: string | null, storageId?: string | null) {
  return useQuery({
    queryKey: ['fridge', householdId, storageId],
    queryFn: async () => {
      const params = storageId ? `?storageId=${storageId}` : '';
      const response = await api.get<FridgeItem[]>(
        `/households/${householdId}/fridge${params}`
      );
      return response.data;
    },
    enabled: !!householdId,
    refetchInterval: 30_000,
  });
}

interface AddFridgeItemPayload {
  name: string;
  quantity: number;
  unit: string;
  storageId?: string;
  category?: string;
  expirationDate?: string;
  fromShoppingListName?: string;
}

export function useAddFridgeItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: AddFridgeItemPayload) => {
      const response = await api.post<FridgeItem>(
        `/households/${householdId}/fridge`,
        payload
      );
      return response.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
      if (variables.fromShoppingListName) {
        queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
      }
    },
  });
}

interface UpdateFridgeItemPayload {
  itemId: string;
  name?: string;
  quantity?: number;
  unit?: string;
  category?: string;
  expirationDate?: string | null;
}

export function useUpdateFridgeItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, ...data }: UpdateFridgeItemPayload) => {
      const response = await api.patch<FridgeItem>(
        `/households/${householdId}/fridge/${itemId}`,
        data,
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
    },
  });
}

export function useRemoveFridgeItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/households/${householdId}/fridge/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fridge', householdId] });
    },
  });
}

export function useFridgeCategories(householdId: string | null, storageId?: string | null) {
  return useQuery({
    queryKey: ['fridge-categories', householdId, storageId],
    queryFn: async () => {
      const params = storageId ? `?storageId=${storageId}` : '';
      const res = await api.get<string[]>(`/households/${householdId}/fridge/categories${params}`);
      return res.data;
    },
    enabled: !!householdId,
  });
}
