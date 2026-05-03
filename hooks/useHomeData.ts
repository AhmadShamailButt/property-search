import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Property } from '@/components/property/PropertyCard';
import { toProperty, getCategoryName, type PropertyRow } from '@/utils/propertyHelpers';

export type HomeBanner = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
};

const PROPERTY_SELECT = `
  id, title, address, city, state, price, bedrooms, bathrooms, is_featured,
  categories ( name ),
  property_images ( image_url, is_hero, sort_order )
`;

export function useProperties(opts: { city?: string; category?: string } = {}) {
  const { city, category } = opts;
  const [data, setData] = useState<Property[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      let query = supabase
        .from('properties')
        .select(PROPERTY_SELECT)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (city) query = query.eq('city', city);

      const { data: rows, error: err } = await query;
      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        const mapped = (rows as unknown as PropertyRow[])
          .filter((r) => {
            if (!category || category === 'All') return true;
            return getCategoryName(r.categories) === category;
          })
          .map(toProperty);
        setData(mapped);
      }
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [city, category, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return { data, isLoading, error, refresh };
}

export function useBanners() {
  const [data, setData] = useState<HomeBanner[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data: rows } = await supabase
        .from('banners')
        .select('id, title, subtitle, image_url, link_url')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });
      if (cancelled) return;
      setData((rows ?? []) as HomeBanner[]);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  return { data, isLoading };
}

export function useFavorites() {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIds(new Set());
      setIsLoading(false);
      return;
    }
    (async () => {
      const { data } = await supabase
        .from('favorites')
        .select('property_id')
        .eq('user_id', user.id);
      if (cancelled) return;
      setIds(new Set((data ?? []).map((r) => r.property_id as string)));
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user]);

  const isFavorite = useCallback((id: string | number) => ids.has(String(id)), [ids]);

  const toggle = useCallback(async (id: string | number) => {
    if (!user) return;
    const key = String(id);
    const wasFav = ids.has(key);
    setIds((prev) => {
      const next = new Set(prev);
      if (wasFav) next.delete(key); else next.add(key);
      return next;
    });
    if (wasFav) {
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('property_id', key);
      if (error) {
        setIds((prev) => { const next = new Set(prev); next.add(key); return next; });
      }
    } else {
      const { error } = await supabase
        .from('favorites')
        .insert({ user_id: user.id, property_id: key });
      if (error) {
        setIds((prev) => { const next = new Set(prev); next.delete(key); return next; });
      }
    }
  }, [ids, user]);

  return useMemo(() => ({ ids, isFavorite, toggle, isLoading }), [ids, isFavorite, toggle, isLoading]);
}

/**
 * Loads the full Property records for every property the current user has favorited.
 * Resolves whenever the favorites Set changes (e.g. after a toggle), so the
 * Favorites tab updates in place.
 */
export function useFavoriteProperties() {
  const { ids, isLoading: idsLoading } = useFavorites();
  const [data, setData] = useState<Property[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  // Stable cache key for the dep array — Set identity isn't useful.
  const idsKey = useMemo(() => [...ids].sort().join(','), [ids]);

  useEffect(() => {
    let cancelled = false;
    if (idsLoading) return;

    if (ids.size === 0) {
      setData([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    (async () => {
      const { data: rows, error: err } = await supabase
        .from('properties')
        .select(PROPERTY_SELECT)
        .in('id', [...ids])
        .eq('is_active', true);

      if (cancelled) return;

      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows as unknown as PropertyRow[]).map(toProperty));
      }
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
    // `ids` is read inside the effect, but `idsKey` is the canonical
    // dep — same content same key, so re-running on `ids` reference
    // changes alone would just thrash the network.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, idsLoading, refreshKey]);

  const refresh = useCallback(() => setRefreshKey((k) => k + 1), []);
  return { data, isLoading: isLoading || idsLoading, error, refresh };
}
