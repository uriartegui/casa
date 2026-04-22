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
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['storages', data.id] });
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

export function useDeleteHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (householdId: string) => {
      await api.delete(`/households/${householdId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useLeaveHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (householdId: string) => {
      await api.delete(`/households/${householdId}/members/me`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function usePromoteToAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, memberId }: { householdId: string; memberId: string }) => {
      await api.patch(`/households/${householdId}/members/${memberId}/promote`);
    },
    onSuccess: (_data, { householdId }) => {
      queryClient.invalidateQueries({ queryKey: ['households'] });
    },
  });
}

export function useJoinHousehold() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (code: string) => {
      const response = await api.post<Household>(`/households/join/${code}`);
      return response.data;
    },
    onSuccess: async (data) => {
      await queryClient.refetchQueries({ queryKey: ['households'] });
      queryClient.invalidateQueries({ queryKey: ['storages', data.id] });
    },
  });
}
