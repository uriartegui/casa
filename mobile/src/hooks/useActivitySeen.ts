import { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ActivityLike = {
  id: string;
  userId?: string | null;
  createdAt: string;
};

const EMPTY_MARKER = '__empty__';

function sortNewestFirst(events: ActivityLike[]) {
  return [...events].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export function useActivitySeen(scope: string, ownerId: string | null, events: ActivityLike[] = [], localUserId?: string | null) {
  const [lastSeenEventId, setLastSeenEventId] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const storageKey = ownerId ? `@colmeia:activity_seen_v2:${scope}:${ownerId}` : null;

  const orderedEvents = useMemo(() => sortNewestFirst(events), [events]);
  const latestActivity = orderedEvents[0] ?? null;
  const lastSeenAt = useMemo(() => {
    if (lastSeenEventId === EMPTY_MARKER) return '1970-01-01T00:00:00.000Z';
    return orderedEvents.find((event) => event.id === lastSeenEventId)?.createdAt ?? null;
  }, [lastSeenEventId, orderedEvents]);

  useEffect(() => {
    let alive = true;
    setHydrated(false);
    setLastSeenEventId(null);

    if (!storageKey) {
      setHydrated(true);
      return () => {
        alive = false;
      };
    }

    AsyncStorage.getItem(storageKey)
      .then((stored) => {
        if (!alive) return;
        if (stored) {
          setLastSeenEventId(stored);
        } else {
          const initialSeenId = latestActivity?.id ?? EMPTY_MARKER;
          setLastSeenEventId(initialSeenId);
          AsyncStorage.setItem(storageKey, initialSeenId).catch(() => {});
        }
        setHydrated(true);
      })
      .catch(() => {
        if (!alive) return;
        setLastSeenEventId(latestActivity?.id ?? EMPTY_MARKER);
        setHydrated(true);
      });

    return () => {
      alive = false;
    };
  }, [latestActivity?.id, storageKey]);

  const unseenCount = useMemo(() => {
    if (!hydrated || !lastSeenEventId) return 0;
    const isCountable = (event: ActivityLike) => {
      if (localUserId && event.userId === localUserId) return false;
      return true;
    };

    if (lastSeenEventId === EMPTY_MARKER) return orderedEvents.filter(isCountable).length;

    const lastSeenIndex = orderedEvents.findIndex((event) => event.id === lastSeenEventId);
    if (lastSeenIndex === -1) return orderedEvents.filter(isCountable).length;
    return orderedEvents.slice(0, lastSeenIndex).filter(isCountable).length;
  }, [hydrated, lastSeenEventId, localUserId, orderedEvents]);

  const markSeen = useCallback(async () => {
    if (!storageKey) return;
    const nextSeenId = latestActivity?.id ?? EMPTY_MARKER;
    setLastSeenEventId(nextSeenId);
    await AsyncStorage.setItem(storageKey, nextSeenId).catch(() => {});
  }, [latestActivity?.id, storageKey]);

  return {
    lastSeenAt,
    latestActivityAt: latestActivity?.createdAt ?? null,
    markSeen,
    unseenCount,
  };
}
