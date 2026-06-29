import { FridgeActivityEntry } from '../hooks/useFridge';
import { FridgeItem, HouseTask, HouseTaskActivityEvent, ShoppingActivityEvent, ShoppingList } from '../types';

export type AlertTone = 'danger' | 'warning' | 'info' | 'success';

export type AlertCenterItem = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  tone: AlertTone;
  createdAt?: string;
  onPress?: () => void;
};

export type AlertCenterSection = {
  title: string;
  items: AlertCenterItem[];
  emptyText: string;
};

const DAY_MS = 86400000;

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function daysUntil(dateKey: string) {
  const today = new Date(`${todayKey()}T00:00:00`).getTime();
  const target = new Date(`${dateKey}T00:00:00`).getTime();
  return Math.ceil((target - today) / DAY_MS);
}

function shortDate(dateKey: string) {
  const [year, month, day] = dateKey.split('-');
  if (!year || !month || !day) return dateKey;
  return `${day}/${month}`;
}

function sortByDateDesc<T extends { createdAt?: string }>(items: T[]) {
  return [...items].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime());
}

export function buildStockAttention(items: FridgeItem[], options?: {
  storageId?: string | null;
  storageName?: string | null;
  onOpenItem?: (item: FridgeItem) => void;
}) {
  const filtered = options?.storageId ? items.filter((item) => item.storageId === options.storageId) : items;
  const alerts: AlertCenterItem[] = [];

  filtered.forEach((item) => {
    if (item.expirationDate) {
      const remaining = daysUntil(item.expirationDate);
      if (remaining <= 7) {
        const storage = options?.storageName ?? item.storage?.name;
        alerts.push({
          id: `stock-expiration-${item.id}`,
          icon: remaining < 0 ? 'alert-octagon' : 'alert-triangle',
          title: item.name,
          subtitle: remaining < 0
            ? `Vencido em ${shortDate(item.expirationDate)}${storage ? ` · ${storage}` : ''}`
            : `Vence em ${remaining === 0 ? 'hoje' : `${remaining} dia${remaining === 1 ? '' : 's'}`}${storage ? ` · ${storage}` : ''}`,
          tone: remaining < 0 ? 'danger' : 'warning',
          onPress: options?.onOpenItem ? () => options.onOpenItem?.(item) : undefined,
        });
      }
    }

    if (!item.category) {
      alerts.push({
        id: `stock-category-${item.id}`,
        icon: 'tag',
        title: item.name,
        subtitle: 'Item sem categoria no estoque.',
        tone: 'info',
        onPress: options?.onOpenItem ? () => options.onOpenItem?.(item) : undefined,
      });
    }
  });

  return alerts.slice(0, 12);
}

export function buildTaskAttention(tasks: HouseTask[], options?: {
  category?: string | null;
  userId?: string | null;
  onOpenTask?: (task: HouseTask) => void;
}) {
  const today = todayKey();
  const filtered = options?.category ? tasks.filter((task) => task.category === options.category) : tasks;

  return filtered
    .filter((task) => !task.done)
    .flatMap((task): AlertCenterItem[] => {
      const alerts: AlertCenterItem[] = [];
      if (task.dueDate && task.dueDate < today) {
        alerts.push({
          id: `task-late-${task.id}`,
          icon: 'clock',
          title: task.title,
          subtitle: `Atrasada desde ${shortDate(task.dueDate)}${task.category ? ` · ${task.category}` : ''}`,
          tone: 'danger',
          onPress: options?.onOpenTask ? () => options.onOpenTask?.(task) : undefined,
        });
      } else if (task.dueDate === today) {
        alerts.push({
          id: `task-today-${task.id}`,
          icon: 'calendar',
          title: task.title,
          subtitle: `Para hoje${task.category ? ` · ${task.category}` : ''}`,
          tone: 'warning',
          onPress: options?.onOpenTask ? () => options.onOpenTask?.(task) : undefined,
        });
      }

      if (task.assignmentType === 'unassigned') {
        alerts.push({
          id: `task-unassigned-${task.id}`,
          icon: 'user-x',
          title: task.title,
          subtitle: `Sem responsável${task.category ? ` · ${task.category}` : ''}`,
          tone: 'info',
          onPress: options?.onOpenTask ? () => options.onOpenTask?.(task) : undefined,
        });
      }

      return alerts;
    })
    .slice(0, 12);
}

export function buildShoppingAttention(lists: ShoppingList[], options?: {
  onOpenList?: (list: ShoppingList) => void;
}) {
  return lists
    .filter((list) => list.urgent || (list.itemCount ?? 0) > 0)
    .sort((a, b) => Number(b.urgent) - Number(a.urgent) || (b.itemCount ?? 0) - (a.itemCount ?? 0))
    .slice(0, 10)
    .map((list): AlertCenterItem => ({
      id: `shopping-${list.id}`,
      icon: list.urgent ? 'alert-circle' : 'shopping-cart',
      title: list.name,
      subtitle: `${list.urgent ? 'Urgente' : 'Pendente'} · ${list.itemCount ?? 0} ${list.itemCount === 1 ? 'item' : 'itens'}${list.place ? ` · ${list.place}` : ''}`,
      tone: list.urgent ? 'warning' : 'info',
      onPress: options?.onOpenList ? () => options.onOpenList?.(list) : undefined,
    }));
}

export function buildStockActivityAlerts(events: FridgeActivityEntry[], options?: {
  storageId?: string | null;
  localUserId?: string | null;
  since?: string | null;
  onOpenEvent?: (event: FridgeActivityEntry) => void;
}) {
  return sortByDateDesc(events)
    .filter((event) => !options?.storageId || event.storageId === options.storageId)
    .filter((event) => !options?.localUserId || event.userId !== options.localUserId)
    .filter((event) => !options?.since || new Date(event.createdAt) > new Date(options.since))
    .slice(0, 8)
    .map((event): AlertCenterItem => ({
      id: `stock-activity-${event.id}`,
      icon: event.action === 'removed' ? 'minus-circle' : event.action === 'updated' ? 'edit-3' : 'plus-circle',
      title: event.itemName,
      subtitle: `${event.userName ?? 'Alguém'} ${event.action === 'removed' ? 'removeu' : event.action === 'updated' ? 'atualizou' : 'adicionou'}${event.storageName ? ` · ${event.storageName}` : ''}`,
      tone: 'info',
      createdAt: event.createdAt,
      onPress: options?.onOpenEvent ? () => options.onOpenEvent?.(event) : undefined,
    }));
}

export function buildShoppingActivityAlerts(events: ShoppingActivityEvent[], options?: {
  localUserId?: string | null;
  since?: string | null;
}) {
  return sortByDateDesc(events)
    .filter((event) => !options?.localUserId || event.userId !== options.localUserId)
    .filter((event) => !options?.since || new Date(event.createdAt) > new Date(options.since))
    .slice(0, 8)
    .map((event): AlertCenterItem => ({
      id: `shopping-activity-${event.id}`,
      icon: event.action === 'sent_to_fridge' ? 'box' : event.action === 'checked' ? 'check-circle' : 'shopping-cart',
      title: event.itemName ?? event.name ?? event.listName,
      subtitle: `${event.userName ?? event.createdBy?.name ?? 'Alguém'} mexeu em ${event.listName}`,
      tone: 'info',
      createdAt: event.createdAt,
    }));
}

export function buildTaskActivityAlerts(events: HouseTaskActivityEvent[], options?: {
  category?: string | null;
  localUserId?: string | null;
  since?: string | null;
}) {
  return sortByDateDesc(events)
    .filter((event) => !options?.localUserId || event.userId !== options.localUserId)
    .filter((event) => !options?.since || new Date(event.createdAt) > new Date(options.since))
    .filter((event) => !options?.category || event.details?.includes(options.category) || event.taskTitle)
    .slice(0, 8)
    .map((event): AlertCenterItem => ({
      id: `task-activity-${event.id}`,
      icon: event.action === 'completed' ? 'check-circle' : event.action === 'deleted' ? 'trash-2' : 'check-square',
      title: event.taskTitle,
      subtitle: `${event.userName ?? 'Alguém'} atualizou uma tarefa`,
      tone: event.action === 'completed' ? 'success' : 'info',
      createdAt: event.createdAt,
    }));
}

export function countAlerts(sections: AlertCenterSection[]) {
  return sections.reduce((total, section) => total + section.items.length, 0);
}
