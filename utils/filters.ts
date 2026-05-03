export type SortKey = 'newest' | 'highest' | 'lowest';
export type Category = 'All' | 'Villa' | 'Apartment' | 'House';

export const CATEGORIES: { value: Category; label: string }[] = [
  { value: 'All', label: 'All' },
  { value: 'Villa', label: 'Villa' },
  { value: 'Apartment', label: 'Apartment' },
  { value: 'House', label: 'House' },
];

const CATEGORY_VALUES: readonly Category[] = ['All', 'Villa', 'Apartment', 'House'];

export const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest' },
  { value: 'highest', label: 'Highest Price' },
  { value: 'lowest', label: 'Lowest Price' },
];

export const ROOM_OPTIONS: { value: number | null; label: string }[] = [
  { value: null, label: 'Any' },
  { value: 1, label: '1' },
  { value: 2, label: '2' },
  { value: 3, label: '3' },
  { value: 4, label: '4' },
  { value: 5, label: '5+' },
];

export const PRICE_BOUNDS = { min: 0, max: 10_000_000, step: 50_000 } as const;
export const AREA_BOUNDS = { min: 0, max: 10_000, step: 50 } as const;

export type FiltersState = {
  category: Category;
  priceMin: number;
  priceMax: number;
  areaMin: number;
  areaMax: number;
  bedrooms: number | null;
  bathrooms: number | null;
  sort: SortKey;
};

export const DEFAULT_FILTERS: FiltersState = {
  category: 'All',
  priceMin: PRICE_BOUNDS.min,
  priceMax: PRICE_BOUNDS.max,
  areaMin: AREA_BOUNDS.min,
  areaMax: AREA_BOUNDS.max,
  bedrooms: null,
  bathrooms: null,
  sort: 'newest',
};

export const formatPrice = (value: number): string => {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(value % 1_000_000 === 0 ? 0 : 1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}k`;
  return `$${value}`;
};

export const formatArea = (value: number): string => `${value.toLocaleString()} sqft`;

const isCategory = (v: unknown): v is Category =>
  typeof v === 'string' && (CATEGORY_VALUES as readonly string[]).includes(v);
const isSort = (v: unknown): v is SortKey =>
  v === 'newest' || v === 'highest' || v === 'lowest';

const num = (v: unknown, fallback: number): number => {
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : fallback;
};

const roomNum = (v: unknown): number | null => {
  if (v === undefined || v === null || v === '') return null;
  const n = typeof v === 'string' ? Number(v) : NaN;
  return Number.isFinite(n) ? n : null;
};

export const parseFilters = (params: Record<string, string | string[] | undefined>): FiltersState => {
  const get = (k: string) => {
    const raw = params[k];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const cat = get('category');
  const sort = get('sort');
  return {
    category: isCategory(cat) ? cat : DEFAULT_FILTERS.category,
    priceMin: num(get('priceMin'), DEFAULT_FILTERS.priceMin),
    priceMax: num(get('priceMax'), DEFAULT_FILTERS.priceMax),
    areaMin: num(get('areaMin'), DEFAULT_FILTERS.areaMin),
    areaMax: num(get('areaMax'), DEFAULT_FILTERS.areaMax),
    bedrooms: roomNum(get('bedrooms')),
    bathrooms: roomNum(get('bathrooms')),
    sort: isSort(sort) ? sort : DEFAULT_FILTERS.sort,
  };
};

export const serializeFilters = (filters: FiltersState): Record<string, string> => {
  const out: Record<string, string> = {};
  if (filters.category !== DEFAULT_FILTERS.category) out.category = filters.category;
  if (filters.priceMin !== DEFAULT_FILTERS.priceMin) out.priceMin = String(filters.priceMin);
  if (filters.priceMax !== DEFAULT_FILTERS.priceMax) out.priceMax = String(filters.priceMax);
  if (filters.areaMin !== DEFAULT_FILTERS.areaMin) out.areaMin = String(filters.areaMin);
  if (filters.areaMax !== DEFAULT_FILTERS.areaMax) out.areaMax = String(filters.areaMax);
  if (filters.bedrooms !== null) out.bedrooms = String(filters.bedrooms);
  if (filters.bathrooms !== null) out.bathrooms = String(filters.bathrooms);
  if (filters.sort !== DEFAULT_FILTERS.sort) out.sort = filters.sort;
  return out;
};

export type ActiveFilterChip = { key: keyof FiltersState | 'price' | 'area'; label: string };

export const activeFilterChips = (filters: FiltersState): ActiveFilterChip[] => {
  const chips: ActiveFilterChip[] = [];
  if (filters.category !== DEFAULT_FILTERS.category) {
    chips.push({ key: 'category', label: filters.category });
  }
  if (filters.priceMin !== DEFAULT_FILTERS.priceMin || filters.priceMax !== DEFAULT_FILTERS.priceMax) {
    chips.push({ key: 'price', label: `${formatPrice(filters.priceMin)} – ${formatPrice(filters.priceMax)}` });
  }
  if (filters.areaMin !== DEFAULT_FILTERS.areaMin || filters.areaMax !== DEFAULT_FILTERS.areaMax) {
    chips.push({ key: 'area', label: `${formatArea(filters.areaMin)} – ${formatArea(filters.areaMax)}` });
  }
  if (filters.bedrooms !== null) chips.push({ key: 'bedrooms', label: `${filters.bedrooms}+ Beds` });
  if (filters.bathrooms !== null) chips.push({ key: 'bathrooms', label: `${filters.bathrooms}+ Baths` });
  return chips;
};

export const removeFilterChip = (filters: FiltersState, chip: ActiveFilterChip): FiltersState => {
  switch (chip.key) {
    case 'category': return { ...filters, category: DEFAULT_FILTERS.category };
    case 'price': return { ...filters, priceMin: DEFAULT_FILTERS.priceMin, priceMax: DEFAULT_FILTERS.priceMax };
    case 'area': return { ...filters, areaMin: DEFAULT_FILTERS.areaMin, areaMax: DEFAULT_FILTERS.areaMax };
    case 'bedrooms': return { ...filters, bedrooms: null };
    case 'bathrooms': return { ...filters, bathrooms: null };
    default: return filters;
  }
};
