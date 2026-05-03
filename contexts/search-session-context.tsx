import React, { createContext, useCallback, useContext, useRef, type PropsWithChildren } from 'react';
import { supabase } from '@/utils/supabase';
import type { FiltersState } from '@/utils/filters';

type RecordSearchLogInput = {
  filters: FiltersState;
  query: string;
  resultCount: number;
  userId: string;
};

type SearchSessionContextType = {
  recordSearchLog: (input: RecordSearchLogInput) => Promise<void>;
  attributeTap: (propertyId: string) => Promise<void>;
};

const SearchSessionContext = createContext<SearchSessionContextType | null>(null);

export function useSearchSession() {
  const ctx = useContext(SearchSessionContext);
  if (!ctx) throw new Error('useSearchSession must be used within SearchSessionProvider');
  return ctx;
}

export function SearchSessionProvider({ children }: PropsWithChildren) {
  // Held in a ref so changes don't trigger re-renders of consumers.
  const lastLogIdRef = useRef<string | null>(null);

  const recordSearchLog = useCallback(async (input: RecordSearchLogInput) => {
    const { filters, query, resultCount, userId } = input;
    const filtersApplied: Record<string, unknown> = { ...filters };
    if (query.trim()) filtersApplied.query = query.trim();

    const { data, error } = await supabase
      .from('filter_logs')
      .insert({
        user_id: userId,
        filters_applied: filtersApplied,
        sort_type: filters.sort,
        result_count: resultCount,
      })
      .select('id')
      .single();

    if (error) {
      // Logging failures are not user-visible; keep them quiet.
      lastLogIdRef.current = null;
      return;
    }
    lastLogIdRef.current = data?.id ?? null;
  }, []);

  const attributeTap = useCallback(async (propertyId: string) => {
    const logId = lastLogIdRef.current;
    if (!logId) return;
    lastLogIdRef.current = null;
    await supabase
      .from('filter_logs')
      .update({ tapped_property_id: propertyId })
      .eq('id', logId);
  }, []);

  return (
    <SearchSessionContext.Provider value={{ recordSearchLog, attributeTap }}>
      {children}
    </SearchSessionContext.Provider>
  );
}
