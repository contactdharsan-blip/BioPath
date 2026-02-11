import { useQuery } from '@tanstack/react-query';
import { searchCompounds } from '../api/pubchem';
import type { PubChemSuggestion } from '../api/types';

export const usePubChemSearch = (query: string, enabled: boolean = true) => {
  return useQuery<PubChemSuggestion[], Error>({
    queryKey: ['pubchem-search', query],
    queryFn: () => searchCompounds(query, 10),
    enabled: enabled && query.length >= 2,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
  });
};
