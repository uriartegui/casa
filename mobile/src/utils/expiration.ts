import * as Notifications from 'expo-notifications';
import { FridgeItem } from '../types';

// Brasília = UTC-3
function todayBrasilia(): Date {
  const now = new Date();
  // Shift to Brasília time, then zero out time portion
  const brasilia = new Date(now.getTime() - 3 * 60 * 60 * 1000);
  brasilia.setUTCHours(0, 0, 0, 0);
  return brasilia;
}

export function daysUntilExpiration(expirationDate: string): number {
  const today = todayBrasilia();
  const exp = new Date(expirationDate + 'T00:00:00Z');
  const diff = exp.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export type ExpirationStatus = 'expired' | 'warning' | 'ok';

export function expirationLabel(expirationDate: string): { text: string; status: ExpirationStatus } {
  const days = daysUntilExpiration(expirationDate);
  if (days < 0) return { text: `⚠️ Vencido há ${Math.abs(days)} dia${Math.abs(days) !== 1 ? 's' : ''}`, status: 'expired' };
  if (days === 0) return { text: '⚠️ Vence hoje', status: 'expired' };
  if (days === 1) return { text: 'Vence amanhã', status: 'warning' };
  if (days <= 5) return { text: `Vence em ${days} dias`, status: 'warning' };
  return { text: `Vence em ${days} dias`, status: 'ok' };
}

const ALERT_DAYS = [10, 5, 2, 1];

export async function scheduleExpirationNotifications(items: FridgeItem[]) {
  try {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const { status: newStatus } = await Notifications.requestPermissionsAsync();
    if (newStatus !== 'granted') return;
  }

  // Cancel all existing expiration notifications before rescheduling
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const n of scheduled) {
    if (n.content.data?.type === 'expiration') {
      await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  }

  const today = todayBrasilia();

  for (const item of items) {
    if (!item.expirationDate) continue;
    const days = daysUntilExpiration(item.expirationDate);

    for (const alertDay of ALERT_DAYS) {
      if (days <= alertDay) continue; // already past this alert point

      const triggerDate = new Date(today.getTime() + (days - alertDay) * 24 * 60 * 60 * 1000);
      triggerDate.setUTCHours(9, 0, 0, 0); // notify at 9am Brasília

      await Notifications.scheduleNotificationAsync({
        content: {
          title: alertDay === 1 ? `⚠️ ${item.name} vence amanhã!` : `🧊 ${item.name}`,
          body: alertDay === 1
            ? 'Ultimo dia antes do vencimento.'
            : `Faltam ${alertDay} dias para vencer.`,
          data: { type: 'expiration', itemId: item.id },
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
      });
    }
  }
  } catch {
    // expo-notifications not available in Expo Go SDK 53+ on Android
  }
}
