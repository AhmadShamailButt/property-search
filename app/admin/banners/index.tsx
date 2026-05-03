import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useFocusEffect } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';

type BannerRow = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  sort_order: number;
  starts_at: string | null;
  ends_at: string | null;
};

export default function AdminBannersScreen() {
  const { theme } = useUnistyles();
  const [banners, setBanners] = useState<BannerRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchBanners = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('banners')
      .select('id, title, subtitle, image_url, link_url, is_active, sort_order, starts_at, ends_at')
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: false });
    if (err) {
      setError(err.message);
      setBanners([]);
    } else {
      setBanners((data ?? []) as BannerRow[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchBanners(); }, [fetchBanners]);

  // Refetch whenever this screen regains focus (after returning from create/edit).
  useFocusEffect(useCallback(() => { fetchBanners(); }, [fetchBanners]));

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchBanners();
    setRefreshing(false);
  }, [fetchBanners]);

  const confirmDelete = (banner: BannerRow) => {
    const proceed = async () => {
      const { error: err } = await supabase.from('banners').delete().eq('id', banner.id);
      if (err) {
        setError(err.message);
        return;
      }
      setBanners((prev) => prev?.filter((b) => b.id !== banner.id) ?? null);
    };
    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Delete banner "${banner.title}"? This cannot be undone.`)) {
        void proceed();
      }
      return;
    }
    Alert.alert(
      'Delete banner',
      `Delete "${banner.title}"? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: proceed },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Banners</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push('/admin/banners/new')}
          accessibilityRole="button"
          accessibilityLabel="Create new banner"
        >
          <Feather name="plus" size={18} color={theme.colors.textInverse} />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />}
      >
        {error ? (
          <View style={styles.errorWrap}>
            <Banner tone="error">{error}</Banner>
          </View>
        ) : null}

        {isLoading && !banners ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.tint} />
          </View>
        ) : !banners || banners.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={styles.emptyIcon}>
              <Feather name="image" size={28} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No banners yet</Text>
            <Text style={styles.emptySub}>Create your first promotional banner to feature on the home carousel.</Text>
            <View style={styles.emptyCta}>
              <Button label="Create banner" icon="plus" variant="primary" size="md" onPress={() => router.push('/admin/banners/new')} />
            </View>
          </View>
        ) : (
          banners.map((banner) => (
            <BannerListItem
              key={banner.id}
              banner={banner}
              onEdit={() => router.push({ pathname: '/admin/banners/[id]', params: { id: banner.id } })}
              onDelete={() => confirmDelete(banner)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function BannerListItem({
  banner,
  onEdit,
  onDelete,
}: {
  banner: BannerRow;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { theme } = useUnistyles();
  return (
    <View style={styles.bannerCard}>
      <View style={styles.bannerImgWrap}>
        <Image source={{ uri: banner.image_url }} style={styles.bannerImg} contentFit="cover" />
        <View style={[styles.statusPill, banner.is_active ? styles.statusPillActive : styles.statusPillInactive]}>
          <Text style={[styles.statusPillText, banner.is_active ? styles.statusPillTextActive : styles.statusPillTextInactive]}>
            {banner.is_active ? 'Active' : 'Hidden'}
          </Text>
        </View>
      </View>
      <View style={styles.bannerInfo}>
        <Text style={styles.bannerTitle} numberOfLines={1}>{banner.title}</Text>
        {banner.subtitle ? <Text style={styles.bannerSub} numberOfLines={2}>{banner.subtitle}</Text> : null}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Feather name="layers" size={12} color={theme.colors.textMuted} />
            <Text style={styles.metaText}>Order {banner.sort_order}</Text>
          </View>
          {banner.starts_at || banner.ends_at ? (
            <View style={styles.metaItem}>
              <Feather name="calendar" size={12} color={theme.colors.textMuted} />
              <Text style={styles.metaText}>{formatRange(banner.starts_at, banner.ends_at)}</Text>
            </View>
          ) : null}
        </View>
      </View>
      <View style={styles.actions}>
        <TouchableOpacity onPress={onEdit} hitSlop={10} accessibilityLabel="Edit banner">
          <Feather name="edit-2" size={20} color={theme.colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} hitSlop={10} accessibilityLabel="Delete banner">
          <Feather name="trash-2" size={20} color={theme.colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const formatRange = (start: string | null, end: string | null): string => {
  const fmt = (iso: string) => iso.slice(0, 10);
  if (start && end) return `${fmt(start)} → ${fmt(end)}`;
  if (start) return `from ${fmt(start)}`;
  if (end) return `until ${fmt(end)}`;
  return '';
};

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing(3), paddingBottom: theme.spacing(1.5) },
  title: { ...theme.typography.h2, color: theme.colors.text },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.tint,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    borderRadius: theme.radii.round,
    gap: theme.spacing(0.5),
  },
  addBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '700' },

  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(8), gap: theme.spacing(2) },

  errorWrap: { marginBottom: theme.spacing(2) },
  loadingWrap: { paddingVertical: theme.spacing(8), alignItems: 'center' },

  emptyWrap: { alignItems: 'center', paddingVertical: theme.spacing(6), gap: theme.spacing(1) },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(1),
  },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary },
  emptySub: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', paddingHorizontal: theme.spacing(3) },
  emptyCta: { marginTop: theme.spacing(2) },

  bannerCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    overflow: 'hidden',
  },
  bannerImgWrap: { position: 'relative' },
  bannerImg: { width: '100%', height: 140, backgroundColor: theme.colors.backgroundSecondary },
  statusPill: {
    position: 'absolute',
    top: theme.spacing(1.25),
    right: theme.spacing(1.25),
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radii.round,
  },
  statusPillActive: { backgroundColor: theme.colors.successBg },
  statusPillInactive: { backgroundColor: theme.colors.scrimStrong },
  statusPillText: { ...theme.typography.caption, fontWeight: '700' },
  statusPillTextActive: { color: theme.colors.success },
  statusPillTextInactive: { color: theme.colors.onImage },

  bannerInfo: { padding: theme.spacing(2), gap: theme.spacing(0.5) },
  bannerTitle: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  bannerSub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5), marginTop: theme.spacing(0.5) },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5) },
  metaText: { ...theme.typography.caption, color: theme.colors.textMuted },

  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    gap: theme.spacing(3),
  },
}));
