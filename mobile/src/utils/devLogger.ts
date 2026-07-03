export function devWarn(message: string, ...details: unknown[]) {
  if (!__DEV__) return;
  if (details.length === 0) console.warn(message);
  else console.warn(message, ...details);
}

export function devError(message: string, ...details: unknown[]) {
  if (!__DEV__) return;
  if (details.length === 0) console.error(message);
  else console.error(message, ...details);
}
