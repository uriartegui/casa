import { useMemo } from 'react';
import { HouseTask } from '../../../types';
import { CATEGORIES, StatusFilter } from '../taskConstants';
import { isLate } from '../taskDateUtils';

type UseTaskFiltersParams = {
  tasks?: HouseTask[];
  initialCategory?: string;
  isCategoryPage: boolean;
  statusFilter: StatusFilter;
  categoryFilter: string;
  userId?: string | null;
};

export function useTaskFilters({
  tasks,
  initialCategory,
  isCategoryPage,
  statusFilter,
  categoryFilter,
  userId,
}: UseTaskFiltersParams) {
  const stats = useMemo(() => {
    const all = tasks ?? [];
    const pending = all.filter((task) => !task.done).length;
    const late = all.filter(isLate).length;
    const done = all.filter((task) => task.done).length;
    return { pending, late, done, total: all.length };
  }, [tasks]);

  const categoryOptions = useMemo(() => {
    const fromTasks = (tasks ?? []).map((task) => task.category).filter(Boolean) as string[];
    return ['Todas', ...Array.from(new Set([...CATEGORIES, ...fromTasks]))];
  }, [tasks]);

  const visibleTasks = useMemo(() => {
    return (tasks ?? []).filter((task) => {
      if (isCategoryPage && task.category !== initialCategory) return false;
      if (statusFilter === 'open' && task.done) return false;
      if (statusFilter === 'done' && !task.done) return false;
      if (statusFilter === 'late' && !isLate(task)) return false;
      if (statusFilter === 'mine' && task.assignedToId !== userId) return false;
      if (categoryFilter !== 'Todas' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, initialCategory, isCategoryPage, statusFilter, tasks, userId]);

  const kanbanTasks = useMemo(() => {
    return (tasks ?? []).filter((task) => {
      if (isCategoryPage && task.category !== initialCategory) return false;
      if (categoryFilter !== 'Todas' && task.category !== categoryFilter) return false;
      return true;
    });
  }, [categoryFilter, initialCategory, isCategoryPage, tasks]);

  const categoryPendingCount = useMemo(
    () => kanbanTasks.filter((task) => !task.done && task.status !== 'completed' && task.status !== 'skipped').length,
    [kanbanTasks],
  );

  return {
    stats,
    categoryOptions,
    visibleTasks,
    kanbanTasks,
    categoryPendingCount,
  };
}
