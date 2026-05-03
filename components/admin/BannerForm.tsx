import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';
import { pickImageFromLibrary, uploadBannerImage } from '@/utils/uploadImage';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { Section } from '@/components/ui/Section';

export type BannerFormValues = {
  title: string;
  subtitle: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  sort_order: string;
  starts_at: string;
  ends_at: string;
};

export const EMPTY_BANNER: BannerFormValues = {
  title: '',
  subtitle: '',
  image_url: '',
  link_url: '',
  is_active: true,
  sort_order: '0',
  starts_at: '',
  ends_at: '',
};

interface BannerFormProps {
  mode: 'create' | 'edit';
  bannerId?: string;
  initialValues?: BannerFormValues;
  title: string;
}

const isValidYMD = (s: string) => s === '' || /^\d{4}-\d{2}-\d{2}$/.test(s);
const ymdToISO = (s: string): string | null => {
  if (s === '') return null;
  const ts = Date.parse(s + 'T00:00:00.000Z');
  return Number.isFinite(ts) ? new Date(ts).toISOString() : null;
};

export function BannerForm({ mode, bannerId, initialValues, title }: BannerFormProps) {
  const { theme } = useUnistyles();
  const { user } = useAuth();
  const [values, setValues] = useState<BannerFormValues>(initialValues ?? EMPTY_BANNER);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const update = useCallback(<K extends keyof BannerFormValues>(key: K, value: BannerFormValues[K]) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handlePickImage = async () => {
    if (!user) return;
    setError(null);
    try {
      const picked = await pickImageFromLibrary();
      if (!picked) return;
      setIsUploading(true);
      const url = await uploadBannerImage(picked, user.id);
      update('image_url', url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const validate = (): string | null => {
    if (!values.title.trim()) return 'Title is required.';
    if (!values.image_url) return 'Banner image is required.';
    const sortOrder = Number(values.sort_order);
    if (!Number.isFinite(sortOrder)) return 'Sort order must be a number.';
    if (!isValidYMD(values.starts_at)) return 'Starts at must be YYYY-MM-DD.';
    if (!isValidYMD(values.ends_at)) return 'Ends at must be YYYY-MM-DD.';
    if (values.starts_at && values.ends_at) {
      const a = Date.parse(values.starts_at);
      const b = Date.parse(values.ends_at);
      if (Number.isFinite(a) && Number.isFinite(b) && a > b) {
        return 'Start date must be before end date.';
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    const v = validate();
    if (v) { setError(v); return; }
    setError(null);
    setIsSaving(true);

    const payload = {
      title: values.title.trim(),
      subtitle: values.subtitle.trim() || null,
      image_url: values.image_url,
      link_url: values.link_url.trim() || null,
      is_active: values.is_active,
      sort_order: Number(values.sort_order) || 0,
      starts_at: ymdToISO(values.starts_at),
      ends_at: ymdToISO(values.ends_at),
    };

    const { error: err } =
      mode === 'create'
        ? await supabase.from('banners').insert(payload)
        : await supabase.from('banners').update(payload).eq('id', bannerId!);

    setIsSaving(false);

    if (err) {
      setError(err.message);
      return;
    }
    router.replace('/admin/banners');
  };

  const canSave = !!user && !isUploading && !isSaving;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>{title}</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {error ? (
          <View style={styles.errorBannerWrap}>
            <Banner tone="error">{error}</Banner>
          </View>
        ) : null}

        <Section label="Image">
          <View style={styles.imageBlock}>
            {values.image_url ? (
              <View style={styles.imagePreview}>
                <Image source={{ uri: values.image_url }} style={styles.imagePreviewInner} contentFit="cover" />
                <TouchableOpacity style={styles.imageRemove} onPress={() => update('image_url', '')}>
                  <Feather name="x" size={16} color={theme.colors.onImage} />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage} disabled={isUploading}>
                <Feather name="image" size={32} color={theme.colors.icon} />
                <Text style={styles.imagePlaceholderText}>
                  {isUploading ? 'Uploading…' : 'Tap to choose image'}
                </Text>
              </TouchableOpacity>
            )}
            {values.image_url ? (
              <Button
                label={isUploading ? 'Uploading…' : 'Replace image'}
                variant="outline"
                size="sm"
                fullWidth
                onPress={handlePickImage}
                isLoading={isUploading}
              />
            ) : null}
          </View>
        </Section>

        <Section label="Content">
          <View style={styles.fieldStack}>
            <Input
              label="Title"
              placeholder="e.g. Find your dream home"
              value={values.title}
              onChangeText={(t) => update('title', t)}
            />
            <Input
              label="Subtitle"
              placeholder="Optional supporting text"
              value={values.subtitle}
              onChangeText={(t) => update('subtitle', t)}
              multiline
            />
            <Input
              label="Link URL"
              placeholder="https://..."
              value={values.link_url}
              onChangeText={(t) => update('link_url', t)}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>
        </Section>

        <Section label="Visibility">
          <View style={styles.fieldStack}>
            <View style={styles.toggleRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.toggleLabel}>Active</Text>
                <Text style={styles.toggleHint}>When off, the banner is hidden from the carousel.</Text>
              </View>
              <Switch
                value={values.is_active}
                onValueChange={(v) => update('is_active', v)}
                trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
              />
            </View>

            <Input
              label="Sort order"
              placeholder="0"
              value={values.sort_order}
              onChangeText={(t) => update('sort_order', t.replace(/[^0-9-]/g, ''))}
              keyboardType="number-pad"
            />

            <Input
              label="Starts at (YYYY-MM-DD, optional)"
              placeholder="YYYY-MM-DD"
              value={values.starts_at}
              onChangeText={(t) => update('starts_at', t)}
              autoCapitalize="none"
            />

            <Input
              label="Ends at (YYYY-MM-DD, optional)"
              placeholder="YYYY-MM-DD"
              value={values.ends_at}
              onChangeText={(t) => update('ends_at', t)}
              autoCapitalize="none"
            />
          </View>
        </Section>

        <View style={styles.submitRow}>
          <Button
            label={mode === 'create' ? 'Create banner' : 'Save changes'}
            variant="primary"
            size="md"
            fullWidth
            onPress={handleSubmit}
            isLoading={isSaving}
            disabled={!canSave}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBtnPlaceholder: { width: 38, height: 38 },
  title: { ...theme.typography.h2, color: theme.colors.text, flex: 1 },

  scroll: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(1), paddingBottom: theme.spacing(8) },

  errorBannerWrap: { marginBottom: theme.spacing(2) },

  imageBlock: { gap: theme.spacing(1.5) },
  imagePreview: {
    width: '100%',
    height: 180,
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  imagePreviewInner: { width: '100%', height: '100%' },
  imageRemove: {
    position: 'absolute',
    top: theme.spacing(1),
    right: theme.spacing(1),
    width: 32,
    height: 32,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.scrimStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  imagePlaceholderText: { ...theme.typography.body, color: theme.colors.textMuted },

  fieldStack: { gap: theme.spacing(1.5) },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing(2),
  },
  toggleLabel: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  toggleHint: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(0.25) },

  submitRow: { marginTop: theme.spacing(3) },
}));
