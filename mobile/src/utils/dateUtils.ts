const MONTHS_PT = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];
const BR_OFFSET_MS = -3 * 60 * 60 * 1000; // UTC-3, sem horário de verão desde 2019

function toBR(isoString: string): Date {
  const utcMs = new Date(isoString).getTime();
  return new Date(utcMs + BR_OFFSET_MS);
}

export function formatBrDate(isoString: string): string {
  const d = toBR(isoString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = MONTHS_PT[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} de ${month}. de ${year}`;
}

export function formatBrTime(isoString: string): string {
  const d = toBR(isoString);
  const h = String(d.getUTCHours()).padStart(2, '0');
  const m = String(d.getUTCMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export function timeAgo(isoString: string): string {
  const diffMs = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'agora';
  if (mins < 60) return `${mins} min atrás`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h atrás`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'ontem';
  return `${days} dias atrás`;
}

export function formatBrShortDate(isoString: string): string {
  const d = toBR(isoString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
