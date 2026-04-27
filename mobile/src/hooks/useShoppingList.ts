import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShoppingItem } from '../types';

export function useAddShoppingItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number; unit?: string }) => {
      const res = await api.post<ShoppingItem>(`/households/${householdId}/shopping-list`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] });
    },
  });
}

export function useToggleShoppingItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const res = await api.patch<ShoppingItem>(
        `/households/${householdId}/shopping-list/${itemId}`,
        { checked },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] });
    },
  });
}

export function useRemoveShoppingItem(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/households/${householdId}/shopping-list/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] });
    },
  });
}

export function useClearCheckedItems(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/households/${householdId}/shopping-list/checked`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list', householdId] });
    },
  });
}
