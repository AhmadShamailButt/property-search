import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { PropertyCard } from '@/components/property/PropertyCard';
import { useFavorites } from '@/hooks/useHomeData';
import { toProperty, type PropertyRow } from '@/utils/propertyHelpers';

type ProfileRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: 'searcher' | 'owner' | 'admin';
  location: string | null;
  member_since: string;
  properties: PropertyRow[] | null;
};

const formatRoleLabel = (role: ProfileRow['role']) => {
  if (role === 'admin') return 'Admin';
  if (role === 'owner') return 'Owner';
  return 'Searcher';
};

export default function PublicProfileScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isFavorite, toggle } = useFavorites();

  const [profile, setProfile] = useState<ProfileRow | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('profiles')
        .select(`
          id, full_name, avatar_url, role, location, member_since,
          properties!properties_owner_id_fkey (
            id, title, address, price, is_featured, is_active,
            categories ( name ),
            property_images ( image_url, is_hero, sort_order )
          )
        `)
        .eq('id', id)
        .eq('properties.is_active', true)
        .maybeSingle();
      if (cancelled) return;
      if (err) setError(err.message);
      else if (!data) setError('Profile not found');
      else setProfile(data as unknown as ProfileRow);
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [id]);

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={theme.colors.tint} />
      </SafeAreaView>
    );
  }

  if (error || !profile) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'Profile not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backLink}>
          <Text style={styles.backLinkText}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const memberYear = new Date(profile.member_since).getFullYear();
  const listings = (profile.properties ?? []).map(toProperty);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          {profile.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} resizeMode="cover" />
          ) : (
            <View style={[styles.avatar, styles.center, styles.avatarPlaceholder]}>
              <Feather name="user" size={48} color={theme.colors.icon} />
            </View>
          )}
          <Text style={styles.name}>{profile.full_name}</Text>
          <View style={styles.roleBadge}>
            <Text style={styles.roleBadgeText}>{formatRoleLabel(profile.role)}</Text>
          </View>
        </View>

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <Feather name="calendar" size={16} color={theme.colors.icon} />
            <Text style={styles.metaLabel}>Member since</Text>
            <Text style={styles.metaValue}>{memberYear}</Text>
          </View>
          {profile.location ? (
            <>
              <View style={styles.divider} />
              <View style={styles.metaRow}>
                <Feather name="map-pin" size={16} color={theme.colors.icon} />
                <Text style={styles.metaLabel}>Location</Text>
                <Text style={styles.metaValue} numberOfLines={1}>{profile.location}</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Listings</Text>
          <Text style={styles.sectionCount}>
            {listings.length} {listings.length === 1 ? 'property' : 'properties'}
          </Text>
        </View>

        {listings.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="home" size={28} color={theme.colors.textMuted} />
            <Text style={styles.emptyText}>No active listings yet.</Text>
          </View>
        ) : (
          <View style={styles.listingsList}>
            {listings.map((p) => (
              <PropertyCard
                key={p.id}
                property={p}
                isFavorite={isFavorite(p.id)}
                onFavorite={() => toggle(p.id)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.textSecondary },
  backLink: { marginTop: theme.spacing(2) },
  backLinkText: { ...theme.typography.label, color: theme.colors.tint, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },

  scrollContent: { paddingHorizontal: theme.spacing(2.5), paddingBottom: theme.spacing(8) },

  hero: { alignItems: 'center', paddingVertical: theme.spacing(3) },
  avatar: {
    width: 112,
    height: 112,
    borderRadius: theme.radii.round,
    marginBottom: theme.spacing(2),
  },
  avatarPlaceholder: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  name: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing(1) },
  roleBadge: {
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.infoBg,
  },
  roleBadgeText: {
    ...theme.typography.caption,
    color: theme.colors.info,
    fontWeight: '700',
  },

  metaCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(3),
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
  },
  metaLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '600' },
  metaValue: { ...theme.typography.label, color: theme.colors.text, marginLeft: 'auto', fontWeight: '600' },
  divider: {
    height: 1,
    backgroundColor: theme.colors.divider,
    marginVertical: theme.spacing(1.25),
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing(1.5),
  },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  sectionCount: { ...theme.typography.caption, color: theme.colors.textSecondary },

  listingsList: { gap: theme.spacing(0) },

  emptyState: {
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(4),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  emptyText: { ...theme.typography.body, color: theme.colors.textMuted },
}));
