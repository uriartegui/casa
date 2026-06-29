import { afterEach, describe, expect, it, vi } from 'vitest';
import { formatBrDate, formatBrShortDate, formatBrTime, timeAgo } from './dateUtils';

describe('dateUtils', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('formats date-only values without shifting the day', () => {
    expect(formatBrShortDate('2026-06-15')).toBe('15/06/2026');
    expect(formatBrDate('2026-06-15')).toBe('15 de jun. de 2026');
  });

  it('formats timestamp values in Brasilia time', () => {
    expect(formatBrTime('2026-06-15T15:30:00.000Z')).toBe('12:30');
  });

  it('returns short relative labels', () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T15:30:00.000Z'));

    expect(timeAgo('2026-06-15T15:29:30.000Z')).toBe('agora');
    expect(timeAgo('2026-06-15T15:00:00.000Z')).toBe('30 min atrás');
    expect(timeAgo('2026-06-15T13:30:00.000Z')).toBe('2h atrás');
  });
});
