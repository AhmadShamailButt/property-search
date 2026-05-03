import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';

type FavoritesContextType = {
  ids: Set<string>;
  isLoading: boolean;
  isFavorite: (id: string | number) => boolean;
  toggle: (id: string | number) => Promise<void>;
};

const FavoritesContext = createContext<FavoritesContextType | null>(null);

/**
 * Reads the favorited-property-id Set + provides toggle.
 * State is shared across the whole app via FavoritesProvider, so toggling
 * on the Home tab is reflected instantly on the Favorites tab and anywhere
 * else that reads from this hook.
 */
export function useFavorites(): FavoritesContextType {
  const ctx = useContext(FavoritesContext);
  if (!ctx) throw new Error('useFavorites must be used within FavoritesProvider');
  return ctx;
}

export function FavoritesProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);

  // Reload the favorites Set whenever the signed-in user changes.
  useEffect(() => {
    let cancelled = false;
    if (!user) {
      setIds(new Set());
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
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

    // Optimistic local update
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
        // Roll back
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

  const value = useMemo<FavoritesContextType>(
    () => ({ ids, isLoading, isFavorite, toggle }),
    [ids, isLoading, isFavorite, toggle],
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}
