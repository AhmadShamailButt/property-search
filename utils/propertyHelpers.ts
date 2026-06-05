import type { Property } from '@/components/property/PropertyCard';

type CategoryEmbed = { name: string } | { name: string }[] | null | undefined;
type ImageEmbed = { image_url: string; is_hero?: boolean | null; sort_order?: number | null }[] | null | undefined;

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80';

export const getCategoryName = (categories: CategoryEmbed): string => {
  if (Array.isArray(categories)) return categories[0]?.name ?? '';
  return categories?.name ?? '';
};

export const getHeroImage = (images: ImageEmbed): string | null => {
  const list = images ?? [];
  const hero =
    list.find((i) => i.is_hero) ??
    [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))[0];
  return hero?.image_url ?? null;
};

export const formatPropertyPrice = (n: number | null | undefined): string =>
  typeof n === 'number'
    ? `$${n.toLocaleString('en-US', { maximumFractionDigits: 0 })}`
    : '—';

/** Row shape compatible with both home and profile listings selects. */
export type PropertyRow = {
  id: string;
  title: string;
  address: string;
  city?: string | null;
  state?: string | null;
  price: number;
  bedrooms?: number | null;
  bathrooms?: number | null;
  is_featured?: boolean | null;
  categories?: CategoryEmbed;
  property_images?: ImageEmbed;
};

/**
 * Denormalize a Supabase property row into the `Property` shape consumed by
 * `<PropertyCard />`. Returns the placeholder image when no hero is found.
 */
export const toProperty = (row: PropertyRow): Property => ({
  id: row.id,
  title: (row.title ?? '').trim(),
  address:
    (row.address ?? '').trim() ||
    [row.city, row.state].filter(Boolean).join(', '),
  price: formatPropertyPrice(row.price),
  type: getCategoryName(row.categories) || 'Property',
  featured: !!row.is_featured,
  image: getHeroImage(row.property_images) || PLACEHOLDER_IMAGE,
  city: row.city ?? undefined,
  bedrooms: row.bedrooms ?? undefined,
  bathrooms: row.bathrooms ?? undefined,
});
