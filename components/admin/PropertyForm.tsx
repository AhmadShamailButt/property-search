import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';
import { pickImageFromLibrary, uploadPropertyImage } from '@/utils/uploadImage';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup';

export type PropertyFormValues = {
  title: string;
  description: string;
  address: string;
  city: string;
  state: string;
  country: string;
  category_id: string | null;
  price: string;
  year_built: string;
  living_area_sqft: string;
  bedrooms: string;
  bathrooms: string;
  living_rooms: string;
  kitchens: string;
  latitude: string;
  longitude: string;
  building_type: string;
  has_garage: boolean;
  has_garden: boolean;
  is_featured: boolean;
  is_active: boolean;
};

export type PropertyImageDraft = {
  id?: string;
  image_url: string;
  is_hero: boolean;
};

export const EMPTY_FORM: PropertyFormValues = {
  title: '',
  description: '',
  address: '',
  city: '',
  state: '',
  country: 'USA',
  category_id: null,
  price: '',
  year_built: '',
  living_area_sqft: '',
  bedrooms: '',
  bathrooms: '',
  living_rooms: '',
  kitchens: '',
  latitude: '',
  longitude: '',
  building_type: '',
  has_garage: false,
  has_garden: false,
  is_featured: false,
  is_active: true,
};

interface PropertyFormProps {
  mode: 'create' | 'edit';
  propertyId?: string;
  initialValues?: PropertyFormValues;
  initialImages?: PropertyImageDraft[];
  title: string;
}

const numOrNull = (s: string): number | null => {
  if (!s.trim()) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const intOrNull = (s: string): number | null => {
  const n = numOrNull(s);
  return n === null ? null : Math.trunc(n);
};

export function PropertyForm({ mode, propertyId, initialValues, initialImages, title }: PropertyFormProps) {
  const { theme } = useUnistyles();
  const { user } = useAuth();

  const [values, setValues] = useState<PropertyFormValues>(initialValues ?? EMPTY_FORM);
  const [images, setImages] = useState<PropertyImageDraft[]>(initialImages ?? []);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('categories')
      .select('id, name')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data }) => {
        if (cancelled) return;
        const list = (data ?? []) as { id: string; name: string }[];
        setCategories(list);
        setValues((v) => (v.category_id ? v : { ...v, category_id: list[0]?.id ?? null }));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const set = useCallback(<K extends keyof PropertyFormValues>(key: K, value: PropertyFormValues[K]) => {
    setValues((v) => ({ ...v, [key]: value }));
  }, []);

  const categoryOptions = useMemo<ChipOption<string>[]>(
    () => categories.map((c) => ({ value: c.id, label: c.name })),
    [categories],
  );

  const appendImage = useCallback((url: string) => {
    setImages((prev) => [...prev, { image_url: url, is_hero: prev.length === 0 }]);
  }, []);

  const addImageFromGallery = useCallback(async () => {
    if (!user) {
      setError('You must be signed in to upload images.');
      return;
    }
    setError(null);
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      setIsUploading(true);
      const publicUrl = await uploadPropertyImage(picked, user.id);
      appendImage(publicUrl);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to upload image.');
    } finally {
      setIsUploading(false);
    }
  }, [user, appendImage]);

  const removeImage = useCallback((index: number) => {
    setImages((prev) => {
      const next = prev.filter((_, i) => i !== index);
      if (next.length > 0 && !next.some((img) => img.is_hero)) {
        return next.map((img, i) => (i === 0 ? { ...img, is_hero: true } : img));
      }
      return next;
    });
  }, []);

  const setHero = useCallback((index: number) => {
    setImages((prev) => prev.map((img, i) => ({ ...img, is_hero: i === index })));
  }, []);

  const validate = (): string | null => {
    if (!values.title.trim()) return 'Title is required.';
    if (!values.address.trim()) return 'Address is required.';
    if (!values.category_id) return 'Category is required.';
    const price = numOrNull(values.price);
    if (price === null || price <= 0) return 'Price must be a positive number.';
    return null;
  };

  const handleSubmit = useCallback(async () => {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }
    if (!user) {
      setError('You must be signed in.');
      return;
    }

    setError(null);
    setIsSaving(true);

    const payload = {
      title: values.title.trim(),
      description: values.description.trim() || null,
      address: values.address.trim(),
      city: values.city.trim() || null,
      state: values.state.trim() || null,
      country: values.country.trim() || 'USA',
      category_id: values.category_id,
      price: numOrNull(values.price) ?? 0,
      year_built: intOrNull(values.year_built),
      living_area_sqft: numOrNull(values.living_area_sqft),
      bedrooms: intOrNull(values.bedrooms) ?? 0,
      bathrooms: intOrNull(values.bathrooms) ?? 0,
      living_rooms: intOrNull(values.living_rooms) ?? 0,
      kitchens: intOrNull(values.kitchens) ?? 0,
      latitude: numOrNull(values.latitude),
      longitude: numOrNull(values.longitude),
      building_type: values.building_type.trim() || null,
      has_garage: values.has_garage,
      has_garden: values.has_garden,
      is_featured: values.is_featured,
      is_active: values.is_active,
    };

    let savedId = propertyId;

    if (mode === 'create') {
      const { data, error: insertErr } = await supabase
        .from('properties')
        .insert({ ...payload, owner_id: user.id })
        .select('id')
        .single();
      if (insertErr || !data) {
        setIsSaving(false);
        setError(insertErr?.message ?? 'Failed to create listing.');
        return;
      }
      savedId = data.id;
    } else if (propertyId) {
      const { error: updateErr } = await supabase.from('properties').update(payload).eq('id', propertyId);
      if (updateErr) {
        setIsSaving(false);
        setError(updateErr.message);
        return;
      }
    }

    if (savedId) {
      const imagesErr = await syncImages(savedId, images, initialImages ?? []);
      if (imagesErr) {
        setIsSaving(false);
        setError(imagesErr);
        return;
      }
    }

    setIsSaving(false);
    router.replace('/admin/listings');
  }, [values, images, mode, propertyId, user, initialImages]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.topBarTextGroup}>
          <Text style={styles.topBarEyebrow}>{mode === 'create' ? 'Create' : 'Edit'}</Text>
          <Text style={styles.topBarTitle}>{title}</Text>
        </View>
        <View style={styles.topBarSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Section title="Basics" icon="file-text" subtitle="Tell buyers what makes this place special">
          <Input label="Title" value={values.title} onChangeText={(v) => set('title', v)} />
          <Input label="Description" value={values.description} onChangeText={(v) => set('description', v)} multiline numberOfLines={4} />
          {categoryOptions.length > 0 && (
            <View style={styles.field}>
              <Text style={styles.label}>Category</Text>
              <ChipGroup<string>
                options={categoryOptions}
                value={values.category_id ?? ''}
                onChange={(v) => set('category_id', v)}
              />
            </View>
          )}
          <Input label="Building type (e.g. Detached, Townhouse)" value={values.building_type} onChangeText={(v) => set('building_type', v)} />
        </Section>

        <Section title="Location" icon="map-pin" subtitle="Where is the property located?">
          <Input label="Address" value={values.address} onChangeText={(v) => set('address', v)} />
          <View style={styles.row2}>
            <View style={styles.flex1}><Input label="City" value={values.city} onChangeText={(v) => set('city', v)} /></View>
            <View style={styles.flex1}><Input label="State" value={values.state} onChangeText={(v) => set('state', v)} /></View>
          </View>
          <Input label="Country" value={values.country} onChangeText={(v) => set('country', v)} />
          <View style={styles.row2}>
            <View style={styles.flex1}><Input label="Latitude" value={values.latitude} onChangeText={(v) => set('latitude', v)} keyboardType="numeric" /></View>
            <View style={styles.flex1}><Input label="Longitude" value={values.longitude} onChangeText={(v) => set('longitude', v)} keyboardType="numeric" /></View>
          </View>
        </Section>

        <Section title="Pricing & size" icon="dollar-sign">
          <Input label="Price (USD)" value={values.price} onChangeText={(v) => set('price', v)} keyboardType="numeric" />
          <View style={styles.row2}>
            <View style={styles.flex1}><Input label="Year built" value={values.year_built} onChangeText={(v) => set('year_built', v)} keyboardType="numeric" /></View>
            <View style={styles.flex1}><Input label="Living area (sqft)" value={values.living_area_sqft} onChangeText={(v) => set('living_area_sqft', v)} keyboardType="numeric" /></View>
          </View>
        </Section>

        <Section title="Rooms" icon="home">
          <View style={styles.row2}>
            <View style={styles.flex1}><Input label="Bedrooms" value={values.bedrooms} onChangeText={(v) => set('bedrooms', v)} keyboardType="numeric" /></View>
            <View style={styles.flex1}><Input label="Bathrooms" value={values.bathrooms} onChangeText={(v) => set('bathrooms', v)} keyboardType="numeric" /></View>
          </View>
          <View style={styles.row2}>
            <View style={styles.flex1}><Input label="Living rooms" value={values.living_rooms} onChangeText={(v) => set('living_rooms', v)} keyboardType="numeric" /></View>
            <View style={styles.flex1}><Input label="Kitchens" value={values.kitchens} onChangeText={(v) => set('kitchens', v)} keyboardType="numeric" /></View>
          </View>
        </Section>

        <Section title="Features" icon="check-square">
          <ToggleRow label="Has garage" description="On-site parking included" value={values.has_garage} onChange={(v) => set('has_garage', v)} />
          <ToggleRow label="Has garden" description="Outdoor green space" value={values.has_garden} onChange={(v) => set('has_garden', v)} />
        </Section>

        <Section title="Visibility" icon="eye">
          <ToggleRow label="Featured" description="Highlight this listing on the home page" value={values.is_featured} onChange={(v) => set('is_featured', v)} />
          <ToggleRow label="Active" description="Visible to searchers when on" value={values.is_active} onChange={(v) => set('is_active', v)} />
        </Section>

        <Section title="Images" icon="image" subtitle="The hero photo appears first in search results">
          {images.length === 0 ? (
            <View style={styles.emptyImages}>
              <View style={styles.emptyIcon}>
                <Feather name="image" size={28} color={theme.colors.icon} />
              </View>
              <Text style={styles.emptyTitle}>No images yet</Text>
              <Text style={styles.emptyHint}>Add at least one photo to publish this listing.</Text>
            </View>
          ) : (
            <View style={styles.imageGrid}>
              {images.map((img, i) => (
                <View key={`${img.image_url}-${i}`} style={styles.imageCard}>
                  <Image source={img.image_url} style={styles.imageThumb} contentFit="cover" />
                  {img.is_hero && (
                    <View style={styles.heroPill}>
                      <Feather name="star" size={10} color={theme.colors.accent} />
                      <Text style={styles.heroPillText}>Hero</Text>
                    </View>
                  )}
                  <View style={styles.imageActions}>
                    {!img.is_hero && (
                      <TouchableOpacity onPress={() => setHero(i)} style={styles.imageActionBtn}>
                        <Feather name="star" size={14} color={theme.colors.icon} />
                        <Text style={styles.imageActionText}>Make hero</Text>
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeImage(i)} style={[styles.imageActionBtn, styles.imageActionRight]}>
                      <Feather name="trash-2" size={14} color={theme.colors.error} />
                      <Text style={styles.imageActionTextDanger}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
          <Button
            label={isUploading ? 'Uploading…' : images.length === 0 ? 'Add photo' : 'Add another photo'}
            icon="plus"
            variant={images.length === 0 ? 'primary' : 'outline'}
            fullWidth
            isLoading={isUploading}
            onPress={addImageFromGallery}
          />
        </Section>

        {error && (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={16} color={theme.colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        <Button
          label={mode === 'create' ? 'Create listing' : 'Save changes'}
          icon={mode === 'create' ? 'plus' : 'check'}
          fullWidth
          isLoading={isSaving}
          onPress={handleSubmit}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

async function syncImages(
  propertyId: string,
  drafts: PropertyImageDraft[],
  initial: PropertyImageDraft[],
): Promise<string | null> {
  const keptIds = new Set(drafts.filter((d) => d.id).map((d) => d.id as string));
  const toDelete = initial.filter((i) => i.id && !keptIds.has(i.id)).map((i) => i.id as string);
  const toInsert = drafts
    .map((d, i) => ({ d, i }))
    .filter(({ d }) => !d.id)
    .map(({ d, i }) => ({ property_id: propertyId, image_url: d.image_url, is_hero: d.is_hero, sort_order: i }));
  const initialById = new Map(initial.filter((i) => i.id).map((i) => [i.id as string, i]));
  const toUpdate = drafts
    .map((d, i) => ({ d, i }))
    .filter(({ d, i }) => {
      if (!d.id) return false;
      const prev = initialById.get(d.id);
      if (!prev) return true;
      return prev.image_url !== d.image_url || prev.is_hero !== d.is_hero || (initial.indexOf(prev) !== i);
    });

  const ops: PromiseLike<{ error: { message: string } | null }>[] = [];
  if (toDelete.length > 0) {
    ops.push(supabase.from('property_images').delete().in('id', toDelete));
  }
  if (toInsert.length > 0) {
    ops.push(supabase.from('property_images').insert(toInsert));
  }
  for (const { d, i } of toUpdate) {
    ops.push(
      supabase
        .from('property_images')
        .update({ image_url: d.image_url, is_hero: d.is_hero, sort_order: i })
        .eq('id', d.id as string),
    );
  }

  const results = await Promise.all(ops);
  const firstErr = results.find((r) => r.error);
  return firstErr?.error?.message ?? null;
}

const Section = ({
  title,
  icon,
  subtitle,
  children,
}: {
  title: string;
  icon: keyof typeof Feather.glyphMap;
  subtitle?: string;
  children: React.ReactNode;
}) => {
  const { theme } = useUnistyles();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Feather name={icon} size={16} color={theme.colors.tint} />
        </View>
        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>
          {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={styles.sectionBody}>{children}</View>
    </View>
  );
};

const ToggleRow = ({
  label,
  description,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) => {
  const { theme } = useUnistyles();
  return (
    <View style={styles.toggleRow}>
      <View style={styles.toggleLabelGroup}>
        <Text style={styles.toggleLabel}>{label}</Text>
        {description && <Text style={styles.toggleDescription}>{description}</Text>}
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ true: theme.colors.tint, false: theme.colors.border }}
        thumbColor={theme.colors.surface}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },

  topBar: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1.5), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { width: 40, height: 40, borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center' },
  topBarTextGroup: { flex: 1, gap: theme.spacing(0.25) },
  topBarEyebrow: { ...theme.typography.caption, color: theme.colors.tint, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  topBarTitle: { ...theme.typography.h3, color: theme.colors.text },
  topBarSpacer: { width: 40 },

  scroll: { padding: theme.spacing(2.5), gap: theme.spacing(2.5), paddingBottom: theme.spacing(6) },

  section: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, padding: theme.spacing(2), gap: theme.spacing(2) },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  sectionIcon: { width: 36, height: 36, borderRadius: theme.radii.md, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  sectionHeaderText: { flex: 1, gap: theme.spacing(0.25) },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  sectionSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary },
  sectionBody: { gap: theme.spacing(1.5) },

  field: { gap: theme.spacing(1) },
  label: { ...theme.typography.label, color: theme.colors.text },

  row2: { flexDirection: 'row', gap: theme.spacing(1.5) },
  flex1: { flex: 1 },

  toggleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: theme.spacing(1.5), paddingHorizontal: theme.spacing(2), backgroundColor: theme.colors.background, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(2) },
  toggleLabelGroup: { flex: 1, gap: theme.spacing(0.25) },
  toggleLabel: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  toggleDescription: { ...theme.typography.caption, color: theme.colors.textSecondary },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  imageCard: { width: '48%', backgroundColor: theme.colors.background, borderRadius: theme.radii.md, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', position: 'relative' },
  imageThumb: { width: '100%', height: 120 },
  imageActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing(1) },
  imageActionBtn: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5) },
  imageActionRight: { marginLeft: 'auto' },
  imageActionText: { ...theme.typography.caption, color: theme.colors.text },
  imageActionTextDanger: { ...theme.typography.caption, color: theme.colors.error },
  heroPill: { position: 'absolute', top: theme.spacing(1), left: theme.spacing(1), flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), paddingHorizontal: theme.spacing(1), paddingVertical: theme.spacing(0.5), borderRadius: theme.radii.sm, backgroundColor: theme.colors.warningBg },
  heroPillText: { ...theme.typography.caption, color: theme.colors.accent, fontWeight: '700' },

  emptyImages: { alignItems: 'center', justifyContent: 'center', paddingVertical: theme.spacing(3), paddingHorizontal: theme.spacing(2), borderRadius: theme.radii.md, borderWidth: 1, borderStyle: 'dashed', borderColor: theme.colors.border, backgroundColor: theme.colors.background, gap: theme.spacing(1) },
  emptyIcon: { width: 56, height: 56, borderRadius: theme.radii.round, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  emptyTitle: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  emptyHint: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center' },

  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1), padding: theme.spacing(1.5), borderRadius: theme.radii.md, backgroundColor: theme.colors.errorBg, borderWidth: 1, borderColor: theme.colors.error },
  errorText: { ...theme.typography.caption, color: theme.colors.error, flex: 1 },
}));
