import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter, useFocusEffect } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { getCategoryName, getHeroImage } from '@/utils/propertyHelpers';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ChipGroup } from '@/components/ui/ChipGroup';

type AdminListingRow = {
  id: string;
  title: string;
  address: string;
  price: number;
  is_featured: boolean;
  is_active: boolean;
  categories: { name: string } | { name: string }[] | null;
  property_images: { image_url: string; is_hero: boolean }[] | null;
};

type StatusFilter = 'all' | 'active' | 'inactive' | 'featured';

const STATUS_OPTIONS = [
  { value: 'all' as StatusFilter, label: 'All' },
  { value: 'active' as StatusFilter, label: 'Active' },
  { value: 'inactive' as StatusFilter, label: 'Inactive' },
  { value: 'featured' as StatusFilter, label: 'Featured' },
];

export default function AdminListingsScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();

  const [rows, setRows] = useState<AdminListingRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async (showSpinner: boolean) => {
    if (showSpinner) setIsLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('properties')
      .select('id, title, address, price, is_featured, is_active, categories(name), property_images(image_url, is_hero)')
      .eq('property_images.is_hero', true)
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setRows((data ?? []) as unknown as AdminListingRow[]);
    if (showSpinner) setIsLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load(rows.length === 0);
    }, [load, rows.length]),
  );

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load(false);
    setIsRefreshing(false);
  }, [load]);

  const updateRow = useCallback(
    async (row: AdminListingRow, patch: Partial<Pick<AdminListingRow, 'is_featured' | 'is_active'>>) => {
      setPendingId(row.id);
      const { error: err } = await supabase.from('properties').update(patch).eq('id', row.id);
      setPendingId(null);
      if (err) {
        setError(err.message);
        return;
      }
      setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, ...patch } : r)));
    },
    [],
  );

  const confirmDelete = useCallback(
    (row: AdminListingRow) => {
      Alert.alert(
        'Delete listing?',
        `"${row.title}" will be permanently removed. Use Deactivate instead if you only want to hide it.`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Delete',
            style: 'destructive',
            onPress: async () => {
              setPendingId(row.id);
              const { error: err } = await supabase.from('properties').delete().eq('id', row.id);
              setPendingId(null);
              if (err) {
                setError(err.message);
                return;
              }
              setRows((prev) => prev.filter((r) => r.id !== row.id));
            },
          },
        ],
      );
    },
    [],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (statusFilter === 'active' && !r.is_active) return false;
      if (statusFilter === 'inactive' && r.is_active) return false;
      if (statusFilter === 'featured' && !r.is_featured) return false;
      if (q && !r.title.toLowerCase().includes(q) && !r.address.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [rows, statusFilter, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>Manage Listings</Text>
          <Text style={styles.subtitle}>{filtered.length} of {rows.length} listings</Text>
        </View>
        <Button label="New" icon="plus" size="sm" onPress={() => router.push('/admin/listings/new')} />
      </View>

      <View style={styles.controls}>
        <Input icon="search" placeholder="Search title or address…" value={query} onChangeText={setQuery} />
        <ChipGroup<StatusFilter> options={STATUS_OPTIONS} value={statusFilter} onChange={setStatusFilter} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.tint} style={{ marginTop: theme.spacing(4) }} />
        ) : error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No listings match.</Text>
        ) : (
          filtered.map((r) => (
            <ListingRow
              key={r.id}
              row={r}
              isPending={pendingId === r.id}
              onOpen={() => router.push(`/property/${r.id}`)}
              onEdit={() => router.push(`/admin/listings/${r.id}/edit`)}
              onToggleFeatured={() => updateRow(r, { is_featured: !r.is_featured })}
              onToggleActive={() => updateRow(r, { is_active: !r.is_active })}
              onDelete={() => confirmDelete(r)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface ListingRowProps {
  row: AdminListingRow;
  isPending: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onToggleFeatured: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
}

const ListingRow = ({ row, isPending, onOpen, onEdit, onToggleFeatured, onToggleActive, onDelete }: ListingRowProps) => {
  const { theme } = useUnistyles();
  const image = getHeroImage(row.property_images);
  const cat = getCategoryName(row.categories);

  return (
    <View style={styles.row}>
      <TouchableOpacity onPress={onOpen} activeOpacity={0.85} style={styles.rowMain}>
        {image ? (
          <Image source={image} style={styles.thumb} contentFit="cover" />
        ) : (
          <View style={[styles.thumb, styles.thumbFallback]}>
            <Feather name="image" size={20} color={theme.colors.icon} />
          </View>
        )}
        <View style={styles.info}>
          <Text style={styles.rowTitle} numberOfLines={1}>{row.title}</Text>
          <Text style={styles.rowAddress} numberOfLines={1}>{row.address}</Text>
          <View style={styles.metaRow}>
            <Text style={styles.price}>${Number(row.price).toLocaleString()}</Text>
            {!!cat && <Text style={styles.metaText}>· {cat}</Text>}
          </View>
          <View style={styles.badges}>
            <View style={[styles.badge, row.is_active ? styles.badgeActive : styles.badgeInactive]}>
              <Text style={[styles.badgeText, { color: row.is_active ? theme.colors.success : theme.colors.error }]}>
                {row.is_active ? 'Active' : 'Inactive'}
              </Text>
            </View>
            {row.is_featured && (
              <View style={[styles.badge, styles.badgeFeatured]}>
                <Feather name="star" size={10} color={theme.colors.accent} />
                <Text style={[styles.badgeText, { color: theme.colors.accent }]}>Featured</Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>

      <View style={styles.actions}>
        <TouchableOpacity onPress={onToggleFeatured} disabled={isPending} style={styles.iconBtn}>
          <Feather name="star" size={18} color={row.is_featured ? theme.colors.accent : theme.colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onToggleActive} disabled={isPending} style={styles.iconBtn}>
          <Feather name={row.is_active ? 'eye-off' : 'eye'} size={18} color={theme.colors.icon} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onEdit} disabled={isPending} style={styles.iconBtn}>
          <Feather name="edit-2" size={18} color={theme.colors.tint} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onDelete} disabled={isPending} style={styles.iconBtn}>
          {isPending ? (
            <ActivityIndicator size="small" color={theme.colors.error} />
          ) : (
            <Feather name="trash-2" size={18} color={theme.colors.error} />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(3), paddingBottom: theme.spacing(1) },
  headerText: { flex: 1, gap: theme.spacing(0.5) },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary },

  controls: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(2), gap: theme.spacing(1.5) },

  scroll: { padding: theme.spacing(2), gap: theme.spacing(1.5), paddingBottom: theme.spacing(6) },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing(4) },

  row: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden' },
  rowMain: { flexDirection: 'row', gap: theme.spacing(2), padding: theme.spacing(2) },
  thumb: { width: 72, height: 72, borderRadius: theme.radii.md },
  thumbFallback: { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  info: { flex: 1, gap: theme.spacing(0.5) },
  rowTitle: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  rowAddress: { ...theme.typography.caption, color: theme.colors.textSecondary },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), flexWrap: 'wrap' },
  price: { ...theme.typography.label, color: theme.colors.price, fontWeight: '700' },
  metaText: { ...theme.typography.caption, color: theme.colors.textSecondary },
  badges: { flexDirection: 'row', gap: theme.spacing(1), marginTop: theme.spacing(0.5) },
  badge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), paddingHorizontal: theme.spacing(1), paddingVertical: 2, borderRadius: theme.radii.sm },
  badgeActive: { backgroundColor: theme.colors.successBg },
  badgeInactive: { backgroundColor: theme.colors.errorBg },
  badgeFeatured: { backgroundColor: theme.colors.warningBg },
  badgeText: { ...theme.typography.caption, fontWeight: '700' },

  actions: { flexDirection: 'row', justifyContent: 'space-around', borderTopWidth: 1, borderTopColor: theme.colors.border, paddingVertical: theme.spacing(1) },
  iconBtn: { width: 44, height: 36, justifyContent: 'center', alignItems: 'center' },
}));
