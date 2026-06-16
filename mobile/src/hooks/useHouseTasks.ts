import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { HouseTask } from '../types';

export function useHouseTasks(householdId: string | null) {
  return useQuery({
    queryKey: ['house-tasks', householdId],
    queryFn: async () => {
      const res = await api.get<HouseTask[]>(`/households/${householdId}/tasks`);
      return res.data;
    },
    enabled: !!householdId,
  });
}

export function useCreateHouseTask(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: { title: string; category?: string | null; dueDate?: string | null }) => {
      const res = await api.post<HouseTask>(`/households/${householdId}/tasks`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['household-attention', householdId] });
    },
  });
}

export function useUpdateHouseTaskStatus(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, done }: { taskId: string; done: boolean }) => {
      const res = await api.patch<HouseTask>(`/households/${householdId}/tasks/${taskId}`, { done });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['household-attention', householdId] });
    },
  });
}

export function useDeleteHouseTask(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      await api.delete(`/households/${householdId}/tasks/${taskId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['household-attention', householdId] });
    },
  });
}
