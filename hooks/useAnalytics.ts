import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabase';
import {
  AREA_BOUNDS,
  DEFAULT_FILTERS,
  PRICE_BOUNDS,
  formatArea,
  formatPrice,
  type FiltersState,
  type SortKey,
} from '@/utils/filters';

const MAX_ROWS = 5000;

export type DateRange = { from: Date; to: Date };

export type FilterLogRow = {
  id: string;
  filters_applied: Partial<FiltersState> & { query?: string } | null;
  sort_type: SortKey | null;
  result_count: number | null;
  tapped_property_id: string | null;
  created_at: string;
};

export type CountedItem = { label: string; count: number };

export type FilterUsageGroup = {
  key: 'category' | 'sort' | 'bedrooms' | 'bathrooms' | 'priceRange' | 'areaRange' | 'city';
  title: string;
  counts: CountedItem[];
};

export type ConversionRow = {
  signature: string;
  humanLabel: string;
  searches: number;
  conversions: number;
  rate: number;
};

// ----------------------------------------------------------------
// Base hook: one network round-trip per range.
// ----------------------------------------------------------------
export function useFilterLogs(range: DateRange) {
  const [data, setData] = useState<FilterLogRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reachedCap, setReachedCap] = useState(false);

  const fromIso = range.from.toISOString();
  const toIso = range.to.toISOString();

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      const { data: rows, error: err } = await supabase
        .from('filter_logs')
        .select('id, filters_applied, sort_type, result_count, tapped_property_id, created_at')
        .gte('created_at', fromIso)
        .lte('created_at', toIso)
        .order('created_at', { ascending: false })
        .limit(MAX_ROWS);

      if (cancelled) return;
      if (err) {
        setError(err.message);
        setData([]);
      } else {
        setData((rows ?? []) as unknown as FilterLogRow[]);
        setReachedCap((rows?.length ?? 0) >= MAX_ROWS);
      }
      setIsLoading(false);
    })();

    return () => { cancelled = true; };
  }, [fromIso, toIso]);

  return { data, isLoading, error, reachedCap };
}

// ----------------------------------------------------------------
// Bucketing helpers
// ----------------------------------------------------------------
const PRICE_BUCKETS: { label: string; min: number; max: number }[] = [
  { label: `< ${formatPrice(500_000)}`,                       min: 0,         max: 500_000 },
  { label: `${formatPrice(500_000)} – ${formatPrice(1_000_000)}`,   min: 500_000,   max: 1_000_000 },
  { label: `${formatPrice(1_000_000)} – ${formatPrice(2_000_000)}`, min: 1_000_000, max: 2_000_000 },
  { label: `${formatPrice(2_000_000)} – ${formatPrice(5_000_000)}`, min: 2_000_000, max: 5_000_000 },
  { label: `${formatPrice(5_000_000)}+`,                      min: 5_000_000, max: Number.POSITIVE_INFINITY },
];

const priceBracketLabel = (priceMin: number, priceMax: number): string | null => {
  // Only count when the user actually narrowed the price (not the full default range)
  if (priceMin === DEFAULT_FILTERS.priceMin && priceMax === DEFAULT_FILTERS.priceMax) return null;
  // Bucket by the upper bound (most common UX is "at most X")
  const cap = priceMax < PRICE_BOUNDS.max ? priceMax : (priceMin > 0 ? Number.POSITIVE_INFINITY : 0);
  const ref = cap === Number.POSITIVE_INFINITY ? priceMin : cap;
  const bucket = PRICE_BUCKETS.find((b) => ref < b.max) ?? PRICE_BUCKETS[PRICE_BUCKETS.length - 1];
  return bucket.label;
};

const areaBracketLabel = (areaMin: number, areaMax: number): string | null => {
  if (areaMin === DEFAULT_FILTERS.areaMin && areaMax === DEFAULT_FILTERS.areaMax) return null;
  const ref = areaMax < AREA_BOUNDS.max ? areaMax : areaMin;
  if (ref < 1000) return `< ${formatArea(1000)}`;
  if (ref < 2000) return `${formatArea(1000)} – ${formatArea(2000)}`;
  if (ref < 4000) return `${formatArea(2000)} – ${formatArea(4000)}`;
  if (ref < 6000) return `${formatArea(4000)} – ${formatArea(6000)}`;
  return `${formatArea(6000)}+`;
};

const tally = (entries: (string | null | undefined)[]): CountedItem[] => {
  const map = new Map<string, number>();
  for (const e of entries) {
    if (e == null) continue;
    map.set(e, (map.get(e) ?? 0) + 1);
  }
  return [...map.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
};

// ----------------------------------------------------------------
// useFilterUsage — most-used filter values, grouped by filter key
// ----------------------------------------------------------------
export function useFilterUsage(rows: FilterLogRow[] | null): FilterUsageGroup[] {
  return useMemo(() => {
    if (!rows) return [];

    const category: (string | null)[] = [];
    const sort: (string | null)[] = [];
    const bedrooms: (string | null)[] = [];
    const bathrooms: (string | null)[] = [];
    const priceRange: (string | null)[] = [];
    const areaRange: (string | null)[] = [];
    const city: (string | null)[] = [];

    for (const row of rows) {
      const f = row.filters_applied ?? {};
      if (f.category && f.category !== DEFAULT_FILTERS.category) category.push(String(f.category));
      if (row.sort_type && row.sort_type !== DEFAULT_FILTERS.sort) sort.push(String(row.sort_type));
      if (f.bedrooms != null) bedrooms.push(`${f.bedrooms}+ Beds`);
      if (f.bathrooms != null) bathrooms.push(`${f.bathrooms}+ Baths`);
      if (f.city) city.push(String(f.city));

      if (typeof f.priceMin === 'number' && typeof f.priceMax === 'number') {
        const label = priceBracketLabel(f.priceMin, f.priceMax);
        if (label) priceRange.push(label);
      }
      if (typeof f.areaMin === 'number' && typeof f.areaMax === 'number') {
        const label = areaBracketLabel(f.areaMin, f.areaMax);
        if (label) areaRange.push(label);
      }
    }

    return [
      { key: 'category',   title: 'Category',     counts: tally(category) },
      { key: 'sort',       title: 'Sort',         counts: tally(sort) },
      { key: 'priceRange', title: 'Price range',  counts: tally(priceRange) },
      { key: 'areaRange',  title: 'Living area',  counts: tally(areaRange) },
      { key: 'bedrooms',   title: 'Bedrooms',     counts: tally(bedrooms) },
      { key: 'bathrooms',  title: 'Bathrooms',    counts: tally(bathrooms) },
      { key: 'city',       title: 'City',         counts: tally(city) },
    ];
  }, [rows]);
}

// ----------------------------------------------------------------
// useTopLocations + useTopPriceBrackets
// ----------------------------------------------------------------
export function useTopLocations(rows: FilterLogRow[] | null): CountedItem[] {
  return useMemo(() => {
    if (!rows) return [];
    return tally(rows.map((r) => (r.filters_applied?.city ? String(r.filters_applied.city) : null)));
  }, [rows]);
}

export function useTopPriceBrackets(rows: FilterLogRow[] | null): CountedItem[] {
  return useMemo(() => {
    if (!rows) return [];
    return tally(
      rows.map((r) => {
        const f = r.filters_applied ?? {};
        if (typeof f.priceMin !== 'number' || typeof f.priceMax !== 'number') return null;
        return priceBracketLabel(f.priceMin, f.priceMax);
      }),
    );
  }, [rows]);
}

// ----------------------------------------------------------------
// useDropOffRate
// ----------------------------------------------------------------
export function useDropOffRate(rows: FilterLogRow[] | null) {
  return useMemo(() => {
    if (!rows || rows.length === 0) {
      return { searches: 0, tapped: 0, rate: 0 };
    }
    const searches = rows.length;
    const tapped = rows.filter((r) => r.tapped_property_id != null).length;
    const rate = 1 - tapped / searches;
    return { searches, tapped, rate };
  }, [rows]);
}

// ----------------------------------------------------------------
// useFilterCombinationConversion
// ----------------------------------------------------------------
const buildSignature = (f: Partial<FiltersState> | null | undefined): string => {
  if (!f) return '__none__';
  const parts: string[] = [];
  if (f.category && f.category !== DEFAULT_FILTERS.category) parts.push(`cat=${f.category}`);
  if (f.city) parts.push(`city=${f.city}`);
  if (typeof f.priceMin === 'number' && typeof f.priceMax === 'number') {
    const lbl = priceBracketLabel(f.priceMin, f.priceMax);
    if (lbl) parts.push(`price=${lbl}`);
  }
  if (typeof f.areaMin === 'number' && typeof f.areaMax === 'number') {
    const lbl = areaBracketLabel(f.areaMin, f.areaMax);
    if (lbl) parts.push(`area=${lbl}`);
  }
  if (f.bedrooms != null) parts.push(`beds=${f.bedrooms}`);
  if (f.bathrooms != null) parts.push(`baths=${f.bathrooms}`);
  return parts.length === 0 ? '__none__' : parts.join('|');
};

const humanLabelFor = (signature: string): string => {
  if (signature === '__none__') return 'Default search';
  return signature
    .split('|')
    .map((p) => {
      const [k, v] = p.split('=');
      switch (k) {
        case 'cat':   return v;
        case 'city':  return v;
        case 'price': return v;
        case 'area':  return v;
        case 'beds':  return `${v}+ Beds`;
        case 'baths': return `${v}+ Baths`;
        default:      return v ?? p;
      }
    })
    .join(' · ');
};

export function useFilterCombinationConversion(rows: FilterLogRow[] | null): ConversionRow[] {
  return useMemo(() => {
    if (!rows) return [];
    const buckets = new Map<string, { searches: number; conversions: number }>();
    for (const row of rows) {
      const sig = buildSignature(row.filters_applied);
      const entry = buckets.get(sig) ?? { searches: 0, conversions: 0 };
      entry.searches += 1;
      if (row.tapped_property_id != null) entry.conversions += 1;
      buckets.set(sig, entry);
    }
    return [...buckets.entries()]
      .map(([signature, { searches, conversions }]) => ({
        signature,
        humanLabel: humanLabelFor(signature),
        searches,
        conversions,
        rate: searches === 0 ? 0 : conversions / searches,
      }))
      .sort((a, b) => b.searches - a.searches)
      .slice(0, 10);
  }, [rows]);
}
