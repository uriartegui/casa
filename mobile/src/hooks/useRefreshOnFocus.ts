import { useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

export function useRefreshOnFocus(refetch: () => void, minIntervalMs = 30_000) {
  const firstRender = useRef(true);
  const lastRefreshAt = useRef(0);

  useFocusEffect(
    useCallback(() => {
      if (firstRender.current) {
        firstRender.current = false;
        lastRefreshAt.current = Date.now();
        return;
      }

      const now = Date.now();
      if (now - lastRefreshAt.current < minIntervalMs) return;
      lastRefreshAt.current = now;
      refetch();
    }, [minIntervalMs, refetch]),
  );
}
