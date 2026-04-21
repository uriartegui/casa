import { QueryClient, focusManager } from '@tanstack/react-query';
import { AppState } from 'react-native';

AppState.addEventListener('change', (status) => {
  focusManager.setFocused(status === 'active');
});

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 0, retry: 1 },
  },
});
