import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { Household, HouseholdAttention } from '../types';

const HOUSEHOLDS_STALE_TIME = 5 * 60 * 1000;

export function useHouseholds() {
  return useQuery({
    queryKey: ['households'],
    queryFn: async () => {
      const response = await api.get<Household[]>('/households');
      return response.data;
    },
    staleTime: HOUSEHOLDS_STALE_TIME,
    refetchOnMount: false,
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

export function useHouseholdAttention(householdId: string | null) {
  return useQuery({
    queryKey: ['household-attention', householdId],
    queryFn: async () => {
      const response = await api.get<HouseholdAttention>(`/households/${householdId}/attention`);
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

export function useRemoveMember() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ householdId, memberId }: { householdId: string; memberId: string }) => {
      await api.delete(`/households/${householdId}/members/${memberId}`);
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
    onSuccess: () => {
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
