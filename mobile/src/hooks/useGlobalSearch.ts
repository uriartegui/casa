import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { GlobalSearchResult } from '../types';

export function useGlobalSearch(householdId: string | null, query: string) {
  const trimmedQuery = query.trim();

  return useQuery({
    queryKey: ['global-search', householdId, trimmedQuery],
    queryFn: async () => {
      const response = await api.get<{ results: GlobalSearchResult[] }>(
        `/households/${householdId}/search`,
        { params: { q: trimmedQuery } },
      );
      return response.data.results;
    },
    enabled: !!householdId && trimmedQuery.length >= 2,
    staleTime: 60_000,
    refetchOnMount: false,
  });
}
