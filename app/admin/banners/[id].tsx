import React, { useEffect, useState } from 'react';
import { Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { useLocalSearchParams } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { Banner } from '@/components/ui/Banner';
import { BannerForm, EMPTY_BANNER, type BannerFormValues } from '@/components/admin/BannerForm';

const ymdFromIso = (iso: string | null): string => (iso ? iso.slice(0, 10) : '');

export default function EditBannerScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [values, setValues] = useState<BannerFormValues | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (!id) return;
    (async () => {
      const { data, error: err } = await supabase
        .from('banners')
        .select('id, title, subtitle, image_url, link_url, is_active, sort_order, starts_at, ends_at')
        .eq('id', id)
        .maybeSingle();
      if (cancelled) return;
      if (err) {
        setError(err.message);
        return;
      }
      if (!data) {
        setError('Banner not found.');
        return;
      }
      setValues({
        ...EMPTY_BANNER,
        title: data.title ?? '',
        subtitle: data.subtitle ?? '',
        image_url: data.image_url ?? '',
        link_url: data.link_url ?? '',
        is_active: !!data.is_active,
        sort_order: String(data.sort_order ?? 0),
        starts_at: ymdFromIso(data.starts_at),
        ends_at: ymdFromIso(data.ends_at),
      });
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (error) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <Banner tone="error">{error}</Banner>
      </SafeAreaView>
    );
  }

  if (!values) {
    return (
      <SafeAreaView style={styles.center} edges={['top']}>
        <ActivityIndicator color={theme.colors.tint} />
        <Text style={styles.muted}>Loading banner…</Text>
      </SafeAreaView>
    );
  }

  return <BannerForm mode="edit" bannerId={id} initialValues={values} title="Edit banner" />;
}

const styles = StyleSheet.create((theme) => ({
  center: {
    flex: 1,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing(3),
    gap: theme.spacing(1.5),
  },
  muted: { ...theme.typography.body, color: theme.colors.textMuted },
}));
