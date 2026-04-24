import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { api } from '../services/api';

const INTERVAL_MS = 5 * 60 * 1000;

export function useKeepAlive() {
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      api.get('/health').catch(() => {});
    }, INTERVAL_MS);
  };

  const stop = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    start();

    const sub = AppState.addEventListener('change', (state: AppStateStatus) => {
      if (state === 'active') start();
      else stop();
    });

    return () => {
      stop();
      sub.remove();
    };
  }, []);
}
