import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { ShoppingList, ShoppingItem, ShoppingActivityEvent, ReplenishmentSuggestion } from '../types';

const LIVE_STALE_TIME = 30 * 1000;
const BACKGROUND_REFETCH_INTERVAL = 60 * 1000;

export function useShoppingLists(householdId: string | null) {
  return useQuery({
    queryKey: ['shopping-lists', householdId],
    queryFn: async () => {
      const res = await api.get<ShoppingList[]>(`/households/${householdId}/shopping-lists`);
      return res.data;
    },
    enabled: !!householdId,
    staleTime: LIVE_STALE_TIME,
    refetchOnMount: false,
    refetchInterval: BACKGROUND_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useCreateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; place?: string; category?: string; urgent?: boolean }) => {
      const res = await api.post<ShoppingList>(`/households/${householdId}/shopping-lists`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useUpdateShoppingList(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ listId, ...data }: { listId: string; name: string; place?: string; category?: string; urgent?: boolean }) => {
      const res = await api.patch<ShoppingList>(`/households/${householdId}/shopping-lists/${listId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
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
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
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
    select: (data: ShoppingItem[] | { items?: ShoppingItem[] }) => (
      Array.isArray(data) ? data : data.items ?? []
    ),
    enabled: !!householdId && !!listId,
    staleTime: LIVE_STALE_TIME,
    refetchOnMount: false,
    refetchInterval: BACKGROUND_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useAddListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['shopping-list-items', householdId, listId];
  const listsQueryKey = ['shopping-lists', householdId];
  return useMutation({
    mutationFn: async (data: { name: string; quantity?: number; unit?: string; category?: string }) => {
      const res = await api.post<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items`,
        data,
      );
      return res.data;
    },
    // Item aparece na lista imediatamente; o registro temporário é
    // substituído pelo real quando o servidor responde.
    onMutate: async (data) => {
      await queryClient.cancelQueries({ queryKey });
      await queryClient.cancelQueries({ queryKey: listsQueryKey });
      const previous = queryClient.getQueryData<ShoppingItem[]>(queryKey);
      const previousLists = queryClient.getQueryData<ShoppingList[]>(listsQueryKey);
      const temp = {
        id: `temp-${Date.now()}`,
        name: data.name,
        quantity: data.quantity ?? 1,
        unit: data.unit ?? 'un',
        category: data.category ?? null,
        checked: false,
      } as ShoppingItem;
      queryClient.setQueryData<ShoppingItem[]>(queryKey, (old) => [...(old ?? []), temp]);
      queryClient.setQueryData<ShoppingList[]>(listsQueryKey, (old) =>
        old?.map((list) => (
          list.id === listId ? { ...list, itemCount: (list.itemCount ?? 0) + 1 } : list
        )),
      );
      return { previous, previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      if (context?.previousLists) queryClient.setQueryData(listsQueryKey, context.previousLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useToggleListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['shopping-list-items', householdId, listId];
  return useMutation({
    mutationFn: async ({ itemId, checked }: { itemId: string; checked: boolean }) => {
      const res = await api.patch<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
        { checked },
      );
      return res.data;
    },
    // Atualização otimista: a UI responde no toque e reverte se o servidor falhar.
    onMutate: async ({ itemId, checked }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingItem[]>(queryKey);
      queryClient.setQueryData<ShoppingItem[]>(queryKey, (old) =>
        old?.map((i) => (i.id === itemId ? { ...i, checked } : i)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useUpdateListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  const queryKey = ['shopping-list-items', householdId, listId];
  return useMutation({
    mutationFn: async ({ itemId, ...data }: {
      itemId: string;
      name?: string;
      quantity?: number;
      unit?: string;
      category?: string | null;
    }) => {
      const res = await api.patch<ShoppingItem>(
        `/households/${householdId}/shopping-lists/${listId}/items/${itemId}`,
        data,
      );
      return res.data;
    },
    onMutate: async ({ itemId, ...data }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<ShoppingItem[]>(queryKey);
      queryClient.setQueryData<ShoppingItem[]>(queryKey, (old) =>
        old?.map((item) => (item.id === itemId ? { ...item, ...data } : item)),
      );
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useRemoveListItem(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  const itemsQueryKey = ['shopping-list-items', householdId, listId];
  const listsQueryKey = ['shopping-lists', householdId];
  return useMutation({
    mutationFn: async (input: string | { itemId: string; reason?: 'removed' | 'sent_to_fridge' }) => {
      const itemId = typeof input === 'string' ? input : input.itemId;
      const reason = typeof input === 'string' ? undefined : input.reason;
      const params = reason ? `?reason=${encodeURIComponent(reason)}` : '';
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/${itemId}${params}`);
    },
    onMutate: async (input) => {
      const itemId = typeof input === 'string' ? input : input.itemId;
      await queryClient.cancelQueries({ queryKey: itemsQueryKey });
      await queryClient.cancelQueries({ queryKey: listsQueryKey });
      const previous = queryClient.getQueryData<ShoppingItem[]>(itemsQueryKey);
      const previousLists = queryClient.getQueryData<ShoppingList[]>(listsQueryKey);

      queryClient.setQueryData<ShoppingItem[]>(itemsQueryKey, (old) => old?.filter((item) => item.id !== itemId));
      queryClient.setQueryData<ShoppingList[]>(listsQueryKey, (old) =>
        old?.map((list) => (
          list.id === listId ? { ...list, itemCount: Math.max(0, (list.itemCount ?? 0) - 1) } : list
        )),
      );

      return { previous, previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(itemsQueryKey, context.previous);
      if (context?.previousLists) queryClient.setQueryData(listsQueryKey, context.previousLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
    },
  });
}

export function useClearCheckedListItems(householdId: string, listId: string) {
  const queryClient = useQueryClient();
  const itemsQueryKey = ['shopping-list-items', householdId, listId];
  const listsQueryKey = ['shopping-lists', householdId];
  return useMutation({
    mutationFn: async () => {
      await api.delete(`/households/${householdId}/shopping-lists/${listId}/items/checked`);
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: itemsQueryKey });
      await queryClient.cancelQueries({ queryKey: listsQueryKey });
      const previous = queryClient.getQueryData<ShoppingItem[]>(itemsQueryKey);
      const previousLists = queryClient.getQueryData<ShoppingList[]>(listsQueryKey);
      const checkedCount = previous?.filter((item) => item.checked).length ?? 0;

      queryClient.setQueryData<ShoppingItem[]>(itemsQueryKey, (old) => old?.filter((item) => !item.checked));
      queryClient.setQueryData<ShoppingList[]>(listsQueryKey, (old) =>
        old?.map((list) => (
          list.id === listId ? { ...list, itemCount: Math.max(0, (list.itemCount ?? 0) - checkedCount) } : list
        )),
      );

      return { previous, previousLists };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) queryClient.setQueryData(itemsQueryKey, context.previous);
      if (context?.previousLists) queryClient.setQueryData(listsQueryKey, context.previousLists);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: itemsQueryKey });
      queryClient.invalidateQueries({ queryKey: ['shopping-lists', householdId] });
      queryClient.invalidateQueries({ queryKey: ['shopping-activity', householdId] });
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
    staleTime: LIVE_STALE_TIME,
    refetchOnMount: false,
    refetchInterval: BACKGROUND_REFETCH_INTERVAL,
    refetchIntervalInBackground: false,
  });
}

export function useReplenishmentSuggestions(householdId: string | null) {
  return useQuery<ReplenishmentSuggestion[]>({
    queryKey: ['replenishment-suggestions', householdId],
    queryFn: async () => {
      const res = await api.get<ReplenishmentSuggestion[]>(`/households/${householdId}/replenishment-suggestions`);
      return res.data;
    },
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
    refetchInterval: 5 * 60 * 1000,
    refetchIntervalInBackground: false,
  });
}
