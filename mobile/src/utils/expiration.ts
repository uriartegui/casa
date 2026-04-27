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

