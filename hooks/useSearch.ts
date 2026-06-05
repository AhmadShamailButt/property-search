import { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { supabase } from '@/utils/supabase';
import {
  DEFAULT_FILTERS,
  FiltersState,
  PRICE_BOUNDS,
  AREA_BOUNDS,
  parseFilters,
  serializeFilters,
} from '@/utils/filters';
import type { Property } from '@/components/property/PropertyCard';
import { useAuth } from '@/contexts/auth-context';
import { useSearchSession } from '@/contexts/search-session-context';
import { toProperty, type PropertyRow } from '@/utils/propertyHelpers';

const filtersAreDefault = (filters: FiltersState): boolean =>
  filters.category === DEFAULT_FILTERS.category &&
  filters.priceMin === DEFAULT_FILTERS.priceMin &&
  filters.priceMax === DEFAULT_FILTERS.priceMax &&
  filters.areaMin === DEFAULT_FILTERS.areaMin &&
  filters.areaMax === DEFAULT_FILTERS.areaMax &&
  filters.bedrooms === DEFAULT_FILTERS.bedrooms &&
  filters.bathrooms === DEFAULT_FILTERS.bathrooms &&
  filters.sort === DEFAULT_FILTERS.sort &&
  filters.city === DEFAULT_FILTERS.city;

export const useSearch = (query: string) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const { recordSearchLog } = useSearchSession();

  const [filters, setFiltersState] = useState<FiltersState>(() => parseFilters(params));
  const [results, setResults] = useState<Property[]>([]);
  const [count, setCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestIdRef = useRef(0);

  const setFilters = (next: FiltersState) => {
    setFiltersState(next);
    router.setParams(serializeFilters(next));
  };

  const reset = () => setFilters(DEFAULT_FILTERS);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current;
      setIsLoading(true);
      setError(null);
      try {
        const categoryJoin = filters.category === 'All' ? 'categories(name)' : 'categories!inner(name)';
        let q = supabase
          .from('properties')
          .select(
            `id, title, address, price, is_featured, ${categoryJoin}, property_images(image_url, is_hero, sort_order)`,
            { count: 'exact' }
          )
          .eq('is_active', true);

        if (filters.category !== 'All') q = q.eq('categories.name', filters.category);
        if (filters.city) q = q.eq('city', filters.city);
        if (filters.priceMin > PRICE_BOUNDS.min) q = q.gte('price', filters.priceMin);
        if (filters.priceMax < PRICE_BOUNDS.max) q = q.lte('price', filters.priceMax);
        if (filters.areaMin > AREA_BOUNDS.min) q = q.gte('living_area_sqft', filters.areaMin);
        if (filters.areaMax < AREA_BOUNDS.max) q = q.lte('living_area_sqft', filters.areaMax);
        if (filters.bedrooms !== null) q = q.gte('bedrooms', filters.bedrooms);
        if (filters.bathrooms !== null) q = q.gte('bathrooms', filters.bathrooms);
        if (query.trim()) q = q.ilike('title', `%${query.trim()}%`);

        switch (filters.sort) {
          case 'newest': q = q.order('created_at', { ascending: false }); break;
          case 'highest': q = q.order('price', { ascending: false }); break;
          case 'lowest': q = q.order('price', { ascending: true }); break;
          default: {
            const _exhaustive: never = filters.sort;
            return _exhaustive;
          }
        }

        const { data, error: err, count: total } = await q;
        if (requestId !== requestIdRef.current) return;
        if (err) throw err;
        setResults((data ?? []).map((row) => toProperty(row as unknown as PropertyRow)));
        setCount(total ?? 0);

        // Log this settled search for analytics — skip pure idle landings
        // (default filters AND empty query) to avoid noise.
        if (user && (!filtersAreDefault(filters) || query.trim().length > 0)) {
          recordSearchLog({
            filters,
            query,
            resultCount: total ?? 0,
            userId: user.id,
          });
        }
      } catch (e) {
        if (requestId !== requestIdRef.current) return;
        setError(e instanceof Error ? e.message : 'Failed to load results');
        setResults([]);
        setCount(0);
      } finally {
        if (requestId === requestIdRef.current) setIsLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
    // recordSearchLog is stable (useCallback in provider); depend on user.id
    // (a stable primitive) to avoid extra re-runs from `user` reference churn.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, query, user?.id]);

  return { filters, setFilters, reset, results, count, isLoading, error };
};
