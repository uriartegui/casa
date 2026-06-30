import { HouseTask } from '../../types';
import { formatBrShortDate } from '../../utils/dateUtils';

export function dateKeyFromOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function dueLabel(dueDate: string | null): string | null {
  if (!dueDate) return null;
  const today = dateKeyFromOffset(0);
  const tomorrow = dateKeyFromOffset(1);
  if (dueDate < today) return `Atrasada - ${formatBrShortDate(dueDate)}`;
  if (dueDate === today) return 'Hoje';
  if (dueDate === tomorrow) return 'Amanhã';
  return formatBrShortDate(dueDate);
}

export function isLate(task: HouseTask) {
  return !!task.dueDate && task.dueDate < dateKeyFromOffset(0) && !task.done;
}

export function dateFromKey(value: string | null): Date {
  return value ? new Date(`${value}T12:00:00`) : new Date();
}

export function dateKeyFromPicker(value: Date): string {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, '0');
  const day = String(value.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}
