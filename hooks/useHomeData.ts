import { useCallback, useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';
import type { Property } from '@/components/property/PropertyCard';

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80';

const formatPrice = (n: number | null | undefined) =>
  typeof n === 'number'
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—';

type DbProperty = {
  id: string;
  title: string;
  address: string;
  city: string | null;
  state: string | null;
  price: number;
  bedrooms: number | null;
  bathrooms: number | null;
  is_featured: boolean;
  categories: { name: string } | { name: string }[] | null;
  property_images: { image_url: string; is_hero: boolean | null; sort_order: number | null }[] | null;
};

const toProperty = (row: DbProperty): Property => {
  const cat = Array.isArray(row.categories) ? row.categories[0]?.name : row.categories?.name;
  const imgs = row.property_images ?? [];
  const hero =
    imgs.find((i) => i.is_hero) ??
    [...imgs].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  return {
    id: row.id,
    title: row.title,
    address: row.address,
    price: formatPrice(row.price),
    type: cat ?? 'Property',
    featured: !!row.is_featured,
    image: hero?.image_url || PLACEHOLDER_IMAGE,
    city: row.city ?? undefined,
    bedrooms: row.bedrooms ?? undefined,
    bathrooms: row.bathrooms ?? undefined,
  };
};

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
        const mapped = (rows as unknown as DbProperty[])
          .filter((r) => {
            if (!category || category === 'All') return true;
            const name = Array.isArray(r.categories) ? r.categories[0]?.name : r.categories?.name;
            return name === category;
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
