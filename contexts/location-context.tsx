import React, { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';

const STORAGE_KEY = '@property-search/current-location/v2';

export type AppLocation = {
  city: string;
  state?: string;
  country?: string;
};

export const SUPPORTED_CITIES: AppLocation[] = [
  { city: 'Los Angeles', state: 'CA', country: 'USA' },
  { city: 'New York',     state: 'NY', country: 'USA' },
  { city: 'Miami',        state: 'FL', country: 'USA' },
  { city: 'San Francisco',state: 'CA', country: 'USA' },
  { city: 'Austin',       state: 'TX', country: 'USA' },
];

export const formatLocation = (loc: AppLocation | null) =>
  !loc ? '' : loc.state ? `${loc.city}, ${loc.state}` : loc.city;

type LocationContextType = {
  location: AppLocation | null;
  isLoading: boolean;
  setLocation: (loc: AppLocation) => Promise<void>;
  clearLocation: () => Promise<void>;
};

const LocationContext = createContext<LocationContextType | null>(null);

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error('useLocation must be used within LocationProvider');
  return ctx;
}

export function LocationProvider({ children }: PropsWithChildren) {
  const { user } = useAuth();
  const [location, setLocationState] = useState<AppLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached && !cancelled) {
          setLocationState(JSON.parse(cached));
          setIsLoading(false);
          return;
        }

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('location')
            .eq('id', user.id)
            .maybeSingle();
          if (cancelled) return;
          if (data?.location) {
            const parts = String(data.location).split(',').map((s) => s.trim());
            const parsed: AppLocation = { city: parts[0], state: parts[1], country: parts[2] };
            setLocationState(parsed);
            await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          }
          // No cached value AND no profile location → state is already null,
          // skip the redundant setState to avoid notifying consumers.
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  const setLocation = useCallback(async (loc: AppLocation) => {
    setLocationState(loc);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(loc));
    if (user) {
      await supabase.from('profiles').update({ location: formatLocation(loc) }).eq('id', user.id);
    }
  }, [user]);

  const clearLocation = useCallback(async () => {
    setLocationState(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
    if (user) {
      await supabase.from('profiles').update({ location: null }).eq('id', user.id);
    }
  }, [user]);

  const value = useMemo(
    () => ({ location, isLoading, setLocation, clearLocation }),
    [location, isLoading, setLocation, clearLocation],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}
