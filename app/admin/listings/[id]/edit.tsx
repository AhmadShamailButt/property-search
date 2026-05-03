import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/utils/supabase';
import {
  PropertyForm,
  EMPTY_FORM,
  type PropertyFormValues,
  type PropertyImageDraft,
} from '@/components/admin/PropertyForm';

type DbProperty = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  category_id: string | null;
  price: number | string;
  year_built: number | null;
  living_area_sqft: number | string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  kitchens: number | null;
  latitude: number | null;
  longitude: number | null;
  building_type: string | null;
  has_garage: boolean | null;
  has_garden: boolean | null;
  is_featured: boolean | null;
  is_active: boolean | null;
};

type DbImage = { id: string; image_url: string; is_hero: boolean | null; sort_order: number | null };

const str = (v: unknown): string => (v === null || v === undefined ? '' : String(v));

const toFormValues = (p: DbProperty): PropertyFormValues => ({
  ...EMPTY_FORM,
  title: p.title ?? '',
  description: p.description ?? '',
  address: p.address ?? '',
  city: p.city ?? '',
  state: p.state ?? '',
  country: p.country ?? 'USA',
  category_id: p.category_id,
  price: str(p.price),
  year_built: str(p.year_built),
  living_area_sqft: str(p.living_area_sqft),
  bedrooms: str(p.bedrooms),
  bathrooms: str(p.bathrooms),
  living_rooms: str(p.living_rooms),
  kitchens: str(p.kitchens),
  latitude: str(p.latitude),
  longitude: str(p.longitude),
  building_type: p.building_type ?? '',
  has_garage: !!p.has_garage,
  has_garden: !!p.has_garden,
  is_featured: !!p.is_featured,
  is_active: p.is_active ?? true,
});

export default function AdminListingEditScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [values, setValues] = useState<PropertyFormValues | null>(null);
  const [images, setImages] = useState<PropertyImageDraft[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      const [{ data: property, error: pErr }, { data: imgs, error: iErr }] = await Promise.all([
        supabase
          .from('properties')
          .select('id, title, description, address, city, state, country, category_id, price, year_built, living_area_sqft, bedrooms, bathrooms, living_rooms, kitchens, latitude, longitude, building_type, has_garage, has_garden, is_featured, is_active')
          .eq('id', id)
          .single(),
        supabase
          .from('property_images')
          .select('id, image_url, is_hero, sort_order')
          .eq('property_id', id)
          .order('sort_order'),
      ]);

      if (cancelled) return;
      if (pErr || !property) {
        setError(pErr?.message ?? 'Listing not found.');
        return;
      }
      setValues(toFormValues(property as DbProperty));
      setImages(((imgs ?? []) as DbImage[]).map((r) => ({ id: r.id, image_url: r.image_url, is_hero: !!r.is_hero })));
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (error) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.error}>{error}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: theme.spacing(2) }}>
          <Text style={[styles.error, { color: theme.colors.tint }]}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  if (!values) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={theme.colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <PropertyForm
      mode="edit"
      propertyId={id}
      initialValues={values}
      initialImages={images}
      title="Edit Listing"
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  error: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: theme.spacing(3) },
}));
