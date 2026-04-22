import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShoppingList, ShoppingItem, ShoppingActivityEvent } from '../types';

export function useShoppingLists(householdId: string | null) {
  return useQuery({
    queryKey: ['shopping-lists', householdId],
    queryFn: async () => {
      const res = await api.get<ShoppingList[]>(`/households/${householdId}/shopping-lists`);
      return res.data;
    },
    enabled: !!householdId,
  });
}

export function useCreateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; place?: string; category?: string }) => {
      const res = await api.post<ShoppingList>(`/households/${householdId}/shopping-lists`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useUpdateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, ...data }: { listId: string; name: string; place?: string; category?: string }) => {
      const res = await api.patch<ShoppingList>(`/households/${householdId}/shopping-lists/${listId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useDeleteShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (listId: string) => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
    },
  });
}

export function useListItems(householdId: string | null, listId: string | null) {
  return useQuery({
    queryKey: ['shopping-list-items', householdId, listId],
    queryFn: async () => {
      const res = await api.get<ShoppingItem[]>(
        `/households/${householdId}/shopping-lists/${listId}/items`,
      );
      return res.data;
    },
    enabled: !!householdId && !!listId,
  });
}

export function useAddListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number; unit?: string }) => {
      const res = await api.post<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items`,
        data,
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useToggleListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const res = await api.patch<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
        { checked },
      );
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
    },
  });
}

export function useRemoveListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (itemId: string) => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/${itemId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useClearCheckedListItems(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/checked`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-list-items', householdId, listId] });
    },
  });
}

export function useShoppingActivity(householdId: string | null) {
  return useQuery<ShoppingActivityEvent[]>({
    queryKey: ["shopping-activity", householdId],
    queryFn: async () => {
      const res = await api.get<ShoppingActivityEvent[]>(`/households/${householdId}/shopping-activity`);
      return res.data;
    },
    enabled: !!householdId,
  });
}
