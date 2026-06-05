import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { getCategoryName, getHeroImage } from '@/utils/propertyHelpers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ChipGroup, type ChipOption } from '@/components/ui/ChipGroup';
import { PropertyCard, type Property } from '@/components/property/PropertyCard';
import { useAuth, type UserRole, ROLE_LABEL } from '@/contexts/auth-context';

const ROLE_OPTIONS: ChipOption<UserRole>[] = [
  { value: 'searcher', label: 'Searcher' },
  { value: 'owner', label: 'Owner' },
  { value: 'admin', label: 'Admin' },
];

type ProfileDetail = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  phone: string | null;
  location: string | null;
  member_since: string;
};

type ListingRow = {
  id: string;
  title: string;
  address: string;
  price: number;
  is_featured: boolean | null;
  categories: { name: string } | { name: string }[] | null;
  property_images: { image_url: string }[] | null;
};

const formatRow = (row: ListingRow): Property => ({
  id: row.id,
  title: row.title,
  address: row.address,
  price: `$${Number(row.price).toLocaleString()}`,
  type: getCategoryName(row.categories) || 'Property',
  featured: !!row.is_featured,
  image: getHeroImage(row.property_images) ?? '',
});

type EditDraft = { full_name: string; phone: string; location: string; role: UserRole };

export default function AdminUserDetailScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user: currentUser } = useAuth();

  const [profile, setProfile] = useState<ProfileDetail | null>(null);
  const [listings, setListings] = useState<Property[]>([]);
  const [counts, setCounts] = useState({ listings: 0, favorites: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  const isSelf = useMemo(() => !!currentUser && currentUser.id === id, [currentUser, id]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    Promise.all([
      supabase
        .from('profiles')
        .select('id, full_name, avatar_url, role, is_active, phone, location, member_since')
        .eq('id', id)
        .single(),
      supabase
        .from('properties')
        .select('id, title, address, price, is_featured, categories(name), property_images(image_url)', { count: 'exact' })
        .eq('owner_id', id)
        .eq('property_images.is_hero', true)
        .order('created_at', { ascending: false }),
      supabase
        .from('favorites')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', id),
    ]).then(([{ data: profileData, error: profileErr }, { data: listingsData, count: listingsCount }, { count: favoritesCount }]) => {
      if (cancelled) return;
      if (profileErr) {
        setError(profileErr.message);
      } else {
        setProfile(profileData as ProfileDetail);
        setListings(((listingsData ?? []) as unknown as ListingRow[]).map(formatRow));
        setCounts({ listings: listingsCount ?? 0, favorites: favoritesCount ?? 0 });
      }
      setIsLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, [id]);

  const toggleActive = useCallback(async () => {
    if (!profile) return;
    setIsPending(true);
    const next = !profile.is_active;
    const { error: err } = await supabase
      .from('profiles')
      .update({ is_active: next })
      .eq('id', profile.id);
    setIsPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setProfile({ ...profile, is_active: next });
  }, [profile]);

  const startEdit = useCallback(() => {
    if (!profile) return;
    setDraft({
      full_name: profile.full_name,
      phone: profile.phone ?? '',
      location: profile.location ?? '',
      role: profile.role,
    });
    setIsEditing(true);
  }, [profile]);

  const cancelEdit = useCallback(() => {
    setIsEditing(false);
    setDraft(null);
  }, []);

  const saveEdit = useCallback(async () => {
    if (!profile || !draft) return;
    if (!draft.full_name.trim()) {
      setError('Name is required.');
      return;
    }
    setError(null);
    setIsPending(true);
    const patch = {
      full_name: draft.full_name.trim(),
      phone: draft.phone.trim() || null,
      location: draft.location.trim() || null,
      role: draft.role,
    };
    const { error: err } = await supabase.from('profiles').update(patch).eq('id', profile.id);
    setIsPending(false);
    if (err) {
      setError(err.message);
      return;
    }
    setProfile({ ...profile, ...patch });
    setIsEditing(false);
    setDraft(null);
  }, [profile, draft]);

  const confirmDelete = useCallback(() => {
    if (!profile) return;
    Alert.alert(
      'Remove user?',
      `"${profile.full_name}" and all of their listings and favorites will be permanently deleted. This cannot be undone. The auth account remains and must be removed separately from Supabase.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsPending(true);
            const { error: err } = await supabase.from('profiles').delete().eq('id', profile.id);
            setIsPending(false);
            if (err) {
              setError(err.message);
              return;
            }
            router.replace('/admin/users');
          },
        },
      ],
    );
  }, [profile]);

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
        <Text style={styles.error}>{error ?? 'User not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: theme.spacing(2) }}>
          <Text style={[styles.error, { color: theme.colors.tint }]}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const memberSince = new Date(profile.member_since).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
  });

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>User Profile</Text>
        {isEditing ? (
          <TouchableOpacity onPress={cancelEdit} style={styles.iconBtn}>
            <Feather name="x" size={24} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={startEdit} style={styles.iconBtn}>
            <Feather name="edit-2" size={20} color={theme.colors.tint} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {isEditing && draft ? (
          <View style={styles.editCard}>
            <Input label="Full name" value={draft.full_name} onChangeText={(v) => setDraft({ ...draft, full_name: v })} />
            <Input label="Phone" value={draft.phone} onChangeText={(v) => setDraft({ ...draft, phone: v })} keyboardType="phone-pad" />
            <Input label="Location" value={draft.location} onChangeText={(v) => setDraft({ ...draft, location: v })} />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Role</Text>
              <ChipGroup<UserRole>
                options={ROLE_OPTIONS}
                value={draft.role}
                onChange={(v) => setDraft({ ...draft, role: v })}
              />
            </View>
            {error && <Text style={styles.error}>{error}</Text>}
            <Button label="Save changes" fullWidth isLoading={isPending} onPress={saveEdit} />
          </View>
        ) : (
          <View style={styles.profileCard}>
            {profile.avatar_url ? (
              <Image source={profile.avatar_url} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarFallback]}>
                <Feather name="user" size={36} color={theme.colors.icon} />
              </View>
            )}
            <Text style={styles.name}>{profile.full_name}</Text>
            <View style={styles.badgeRow}>
              <View style={[styles.roleBadge, profile.role === 'admin' && styles.roleBadgeAdmin]}>
                <Text style={[styles.roleText, profile.role === 'admin' && styles.roleTextAdmin]}>
                  {ROLE_LABEL[profile.role]}
                </Text>
              </View>
              <View style={[styles.statusBadge, profile.is_active ? styles.statusActive : styles.statusInactive]}>
                <View style={[styles.statusDot, { backgroundColor: profile.is_active ? theme.colors.success : theme.colors.error }]} />
                <Text style={[styles.statusText, { color: profile.is_active ? theme.colors.success : theme.colors.error }]}>
                  {profile.is_active ? 'Active' : 'Inactive'}
                </Text>
              </View>
            </View>

            <View style={styles.metaList}>
              <MetaRow icon="calendar" label="Member since" value={memberSince} />
              {profile.location && <MetaRow icon="map-pin" label="Location" value={profile.location} />}
              {profile.phone && <MetaRow icon="phone" label="Phone" value={profile.phone} />}
            </View>
          </View>
        )}

        {!isEditing && (
          <>
            <View style={styles.statsRow}>
              <Stat label={profile.role === 'owner' ? 'Listings' : 'Properties'} value={counts.listings} />
              <View style={styles.statDivider} />
              <Stat label="Favorites" value={counts.favorites} />
            </View>

            <Button
              label={profile.is_active ? 'Deactivate Account' : 'Activate Account'}
              variant={profile.is_active ? 'outline' : 'primary'}
              fullWidth
              isLoading={isPending}
              onPress={toggleActive}
            />

            {!isSelf && (
              <Button
                label="Remove User"
                icon="trash-2"
                variant="outline"
                fullWidth
                isLoading={isPending}
                onPress={confirmDelete}
                style={styles.deleteBtn}
              />
            )}

            {listings.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Listings ({counts.listings})</Text>
                <View style={styles.listingsList}>
                  {listings.map((p) => (
                    <PropertyCard key={p.id} property={p} />
                  ))}
                </View>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const MetaRow = ({ icon, label, value }: { icon: keyof typeof Feather.glyphMap; label: string; value: string }) => {
  const { theme } = useUnistyles();
  return (
    <View style={styles.metaRow}>
      <Feather name={icon} size={14} color={theme.colors.textSecondary} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
};

const Stat = ({ label, value }: { label: string; value: number }) => (
  <View style={styles.stat}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  error: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', paddingHorizontal: theme.spacing(3) },

  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1) },
  topBarTitle: { ...theme.typography.h3, color: theme.colors.text },
  iconBtn: { width: 40, height: 40, justifyContent: 'center', alignItems: 'center' },

  scroll: { padding: theme.spacing(3), gap: theme.spacing(3) },

  profileCard: { alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(3), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(1) },
  avatar: { width: 96, height: 96, borderRadius: theme.radii.round, marginBottom: theme.spacing(1) },
  avatarFallback: { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  name: { ...theme.typography.h2, color: theme.colors.text },
  badgeRow: { flexDirection: 'row', gap: theme.spacing(1), marginTop: theme.spacing(0.5) },
  roleBadge: { paddingHorizontal: theme.spacing(1.5), paddingVertical: 4, borderRadius: theme.radii.sm, backgroundColor: theme.colors.infoBg },
  roleBadgeAdmin: { backgroundColor: theme.colors.accent },
  roleText: { ...theme.typography.caption, color: theme.colors.info, fontWeight: '700' },
  roleTextAdmin: { color: theme.colors.textInverse },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), paddingHorizontal: theme.spacing(1.5), paddingVertical: 4, borderRadius: theme.radii.sm },
  statusActive: { backgroundColor: theme.colors.successBg },
  statusInactive: { backgroundColor: theme.colors.errorBg },
  statusDot: { width: theme.spacing(0.75), height: theme.spacing(0.75), borderRadius: theme.radii.round },
  statusText: { ...theme.typography.caption, fontWeight: '700' },

  metaList: { width: '100%', marginTop: theme.spacing(2), gap: theme.spacing(1) },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  metaLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, flex: 1 },
  metaValue: { ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' },

  statsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, paddingVertical: theme.spacing(2) },
  stat: { flex: 1, alignItems: 'center', gap: theme.spacing(0.5) },
  statValue: { ...theme.typography.h2, color: theme.colors.tint },
  statLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  statDivider: { width: 1, backgroundColor: theme.colors.border },

  section: { gap: theme.spacing(2) },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text },
  listingsList: { gap: theme.spacing(2) },

  editCard: { backgroundColor: theme.colors.surface, padding: theme.spacing(3), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(2) },
  fieldGroup: { gap: theme.spacing(1) },
  fieldLabel: { ...theme.typography.label, color: theme.colors.text },
  deleteBtn: { borderColor: theme.colors.error },
}));
