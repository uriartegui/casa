import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { FridgeItem } from '../types';

export function useFridge(householdId: string | null) {
  return useQuery({
    queryKey: ['fridge', householdId],
    queryFn: async () => {
      const response = await api.get<FridgeItem[]>(
        `/households/${householdId}/fridge`
      );
      return response.data;
    },
    enabled: !!householdId,
  });
}

interface AddFridgeItemPayload {
  name: string;
  quantity: number;
  unit: string;
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
