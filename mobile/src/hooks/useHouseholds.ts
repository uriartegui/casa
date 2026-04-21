import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Household } from '../types';

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await api.get<Household[]>('/households');
      return response.data;
    },
  });
}

export function useCreateHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string) => {
      const response = await api.post<Household>('/households', { name });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useInviteCode(householdId: string) {
  return useQuery({
    queryKey: ['invite', householdId],
    queryFn: async () => {
      const response = await api.get<{ inviteCode: string }>(
        `/households/${householdId}/invite`
      );
      return response.data;
    },
    enabled: !!householdId,
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post<Household>(`/households/join/${code}`);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}
