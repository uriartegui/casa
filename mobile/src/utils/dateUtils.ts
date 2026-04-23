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

export function formatBrShortDate(isoString: string): string {
  const d = toBR(isoString);
  const day = String(d.getUTCDate()).padStart(2, '0');
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const year = d.getUTCFullYear();
  return `${day}/${month}/${year}`;
}
