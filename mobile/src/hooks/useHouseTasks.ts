import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../services/api';
import { HouseTask, HouseTaskActivityEvent, TaskCategory } from '../types';

const TASKS_STALE_TIME = 30 * 1000;

export type HouseTaskInput = {
  title: string;
  description?: string | null;
  category?: string | null;
  dueDate?: string | null;
  assignmentType?: 'unassigned' | 'all' | 'user';
  assignedToId?: string | null;
  shoppingListId?: string | null;
  recurrence?: HouseTask['recurrence'];
  recurrenceIntervalDays?: number | null;
  reminder?: HouseTask['reminder'];
};

export function useHouseTasks(householdId: string | null) {
  return useQuery({
    queryKey: ['house-tasks', householdId],
    queryFn: async () => {
      const res = await api.get<HouseTask[]>(`/households/${householdId}/tasks`);
      return res.data;
    },
    enabled: !!householdId,
    staleTime: TASKS_STALE_TIME,
    refetchOnMount: 'always',
  });
}

export function useHouseTaskActivity(householdId: string | null) {
  return useQuery({
    queryKey: ['house-task-activity', householdId],
    queryFn: async () => (await api.get<HouseTaskActivityEvent[]>(`/households/${householdId}/task-activity`)).data,
    enabled: !!householdId,
    staleTime: TASKS_STALE_TIME,
    refetchOnMount: 'always',
  });
}

export function useTaskCategories(householdId: string | null) {
  return useQuery({
    queryKey: ['task-categories', householdId],
    queryFn: async () => (await api.get<TaskCategory[]>(`/households/${householdId}/task-categories`)).data,
    enabled: !!householdId,
    staleTime: 5 * 60 * 1000,
    refetchOnMount: false,
  });
}

export function useCreateHouseTask(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: HouseTaskInput) => {
      const res = await api.post<HouseTask>(`/households/${householdId}/tasks`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['house-task-activity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['household-attention', householdId] });
    },
  });
}

export function useUpdateHouseTaskStatus(householdId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, ...data }: { taskId: string; done?: boolean; status?: HouseTask['status'] } & Partial<HouseTaskInput>) => {
      const res = await api.patch<HouseTask>(`/households/${householdId}/tasks/${taskId}`, data);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['house-tasks', householdId] });
      queryClient.invalidateQueries({ queryKey: ['house-task-activity', householdId] });
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
      queryClient.invalidateQueries({ queryKey: ['house-task-activity', householdId] });
      queryClient.invalidateQueries({ queryKey: ['household-attention', householdId] });
    },
  });
}
