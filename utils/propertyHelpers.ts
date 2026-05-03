type CategoryEmbed = { name: string } | { name: string }[] | null | undefined;
type ImageEmbed = { image_url: string; is_hero?: boolean | null }[] | null | undefined;

export const getCategoryName = (categories: CategoryEmbed): string => {
  if (Array.isArray(categories)) return categories[0]?.name ?? '';
  return categories?.name ?? '';
};

export const getHeroImage = (images: ImageEmbed): string | null => {
  const list = images ?? [];
  return list.find((i) => i.is_hero)?.image_url ?? list[0]?.image_url ?? null;
};
