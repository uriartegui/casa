import React from 'react';
import { FridgeItem, HouseTask, ShoppingList } from '../../../types';

type UseHomeTodayParams = {
  userName?: string;
  userId?: string;
  fridgeItems?: FridgeItem[];
  houseTasks: HouseTask[];
  shoppingLists?: ShoppingList[];
};

function formatShortDate(date: string) {
  const [year, month, day] = date.split('-');
  if (!year || !month || !day) return date;
  return `${day}/${month}`;
}

export function useHomeToday({
  userName,
  userId,
  fridgeItems,
  houseTasks,
  shoppingLists,
}: UseHomeTodayParams) {
  const firstName = userName?.split(' ')[0] ?? 'você';
  const today = React.useMemo(() => new Date(), []);
  const todayLabel = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  const todayKey = React.useMemo(() => new Date().toISOString().slice(0, 10), []);
  const urgentLists = React.useMemo(() => (shoppingLists ?? []).filter((list) => list.urgent), [shoppingLists]);
  const priorityTasks = React.useMemo(() => (
    houseTasks
      .filter((task) => !task.done && (task.dueDate === todayKey || (task.dueDate && task.dueDate < todayKey) || task.assignedToId === userId))
      .slice(0, 3)
  ), [houseTasks, todayKey, userId]);
  const expiringItems = React.useMemo(() => {
    const todayAtStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return (fridgeItems ?? [])
      .filter((item) => {
        if (!item.expirationDate) return false;
        const expiration = new Date(`${item.expirationDate}T00:00:00`);
        const diffDays = Math.ceil((expiration.getTime() - todayAtStart.getTime()) / 86400000);
        return diffDays <= 7;
      })
      .sort((a, b) => {
        const aTime = a.expirationDate ? new Date(`${a.expirationDate}T00:00:00`).getTime() : Infinity;
        const bTime = b.expirationDate ? new Date(`${b.expirationDate}T00:00:00`).getTime() : Infinity;
        return aTime - bTime;
      });
  }, [fridgeItems, today]);

  return {
    firstName,
    todayLabel,
    todayKey,
    urgentLists,
    priorityTasks,
    expiringItems,
    todayAttentionCount: expiringItems.length + priorityTasks.length + urgentLists.length,
    formatShortDate,
  };
}
