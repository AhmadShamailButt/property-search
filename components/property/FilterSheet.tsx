import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { RangeSlider } from '@/components/ui/RangeSlider';
import { Section } from '@/components/ui/Section';
import { SUPPORTED_CITIES } from '@/contexts/location-context';
import {
  AREA_BOUNDS,
  CATEGORIES,
  Category,
  DEFAULT_FILTERS,
  FiltersState,
  PRICE_BOUNDS,
  ROOM_OPTIONS,
  SORT_OPTIONS,
  SortKey,
  formatArea,
  formatPrice,
} from '@/utils/filters';

const CITY_OPTIONS: { value: string | null; label: string }[] = [
  { value: null, label: 'All' },
  ...SUPPORTED_CITIES.map((c) => ({ value: c.city, label: c.city })),
];

interface FilterSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: FiltersState;
  onApply: (filters: FiltersState) => void;
}

export const FilterSheet = ({ visible, onClose, filters, onApply }: FilterSheetProps) => {
  const [draft, setDraft] = useState<FiltersState>(filters);

  useEffect(() => {
    if (visible) setDraft(filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  const update = <K extends keyof FiltersState>(key: K, value: FiltersState[K]) =>
    setDraft((prev) => ({ ...prev, [key]: value }));

  const handleReset = () => setDraft(DEFAULT_FILTERS);
  const handleApply = () => {
    onApply(draft);
    onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      title="Filter & Sort"
      footer={
        <>
          <View style={styles.footerBtn}>
            <Button label="Reset" variant="outline" size="md" fullWidth onPress={handleReset} />
          </View>
          <View style={styles.footerBtnPrimary}>
            <Button label="Apply Filters" variant="primary" size="md" fullWidth onPress={handleApply} />
          </View>
        </>
      }
    >
      <Section label="Category">
        <ChipGroup<Category>
          options={CATEGORIES}
          value={draft.category}
          onChange={(v) => update('category', v)}
        />
      </Section>

      <Section label="Location">
        <ChipGroup<string | null>
          options={CITY_OPTIONS}
          value={draft.city}
          onChange={(v) => update('city', v)}
        />
      </Section>

      <Section
        label="Price Range"
        hint={`${formatPrice(draft.priceMin)} – ${formatPrice(draft.priceMax)}`}
      >
        <RangeSlider
          min={PRICE_BOUNDS.min}
          max={PRICE_BOUNDS.max}
          step={PRICE_BOUNDS.step}
          value={[draft.priceMin, draft.priceMax]}
          onChange={([lo, hi]) => setDraft((p) => ({ ...p, priceMin: lo, priceMax: hi }))}
          formatLabel={formatPrice}
        />
      </Section>

      <Section label="Sort By">
        <ChipGroup<SortKey>
          options={SORT_OPTIONS}
          value={draft.sort}
          onChange={(v) => update('sort', v)}
        />
      </Section>

      <Section
        label="Living Area"
        hint={`${formatArea(draft.areaMin)} – ${formatArea(draft.areaMax)}`}
      >
        <RangeSlider
          min={AREA_BOUNDS.min}
          max={AREA_BOUNDS.max}
          step={AREA_BOUNDS.step}
          value={[draft.areaMin, draft.areaMax]}
          onChange={([lo, hi]) => setDraft((p) => ({ ...p, areaMin: lo, areaMax: hi }))}
          formatLabel={formatArea}
        />
      </Section>

      <Section label="Bedrooms">
        <ChipGroup<number | null>
          options={ROOM_OPTIONS}
          value={draft.bedrooms}
          onChange={(v) => update('bedrooms', v)}
        />
      </Section>

      <Section label="Bathrooms">
        <ChipGroup<number | null>
          options={ROOM_OPTIONS}
          value={draft.bathrooms}
          onChange={(v) => update('bathrooms', v)}
        />
      </Section>
    </BottomSheet>
  );
};

const styles = StyleSheet.create(() => ({
  footerBtn: { flex: 1 },
  footerBtnPrimary: { flex: 2 },
}));
