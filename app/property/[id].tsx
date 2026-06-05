import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator, Platform, Linking, Image, Share } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { formatArea } from '@/utils/filters';
import { useAuth } from '@/contexts/auth-context';
import { useFavorites } from '@/hooks/useHomeData';
import { formatPropertyPrice } from '@/utils/propertyHelpers';

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1400&q=80';

type PropertyDetail = {
  id: string;
  title: string;
  description: string | null;
  address: string;
  city: string | null;
  state: string | null;
  price: number;
  year_built: number | null;
  living_area_sqft: number | null;
  bedrooms: number | null;
  bathrooms: number | null;
  living_rooms: number | null;
  kitchens: number | null;
  has_garage: boolean | null;
  has_garden: boolean | null;
  building_type: string | null;
  is_featured: boolean | null;
  is_active: boolean | null;
  ai_score: number | null;
  ai_score_summary: string | null;
  created_at: string;
  categories: { name: string } | { name: string }[] | null;
  property_images: { image_url: string; is_hero: boolean | null; sort_order: number | null }[] | null;
  profiles: { id: string; full_name: string; avatar_url: string | null; phone: string | null } | null;
};

const formatRelativeDays = (iso: string): string => {
  const days = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000));
  if (days === 0) return 'today';
  if (days === 1) return '1 day ago';
  return `${days} days ago`;
};

export default function PropertyDetailScreen() {
  const { theme } = useUnistyles();
  const { width: screenWidth } = useWindowDimensions();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Description' | 'Features'>('Description');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const { isFavorite: isFavoriteFn, toggle: toggleFavorite } = useFavorites();
  const isFavorite = property ? isFavoriteFn(property.id) : false;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setIsLoading(true);
      setError(null);
      const { data, error: err } = await supabase
        .from('properties')
        .select(`
          id, title, description, address, city, state, price, year_built,
          living_area_sqft, bedrooms, bathrooms, living_rooms, kitchens,
          has_garage, has_garden, building_type, is_featured, is_active,
          ai_score, ai_score_summary, created_at,
          categories(name),
          property_images(image_url, is_hero, sort_order),
          profiles!properties_owner_id_fkey(id, full_name, avatar_url, phone)
        `)
        .eq('id', id)
        .single();
      if (cancelled) return;
      if (err) setError(err.message);
      else setProperty(data as unknown as PropertyDetail);
      setIsLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.colors.tint} />
      </View>
    );
  }

  if (error || !property) {
    return (
      <View style={[styles.container, styles.center]}>
        <Text style={styles.errorText}>{error ?? 'Property not found.'}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.errorText, { color: theme.colors.tint, marginTop: theme.spacing(2) }]}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const images = (property.property_images ?? [])
    .slice()
    .sort((a, b) => {
      if (a.is_hero && !b.is_hero) return -1;
      if (b.is_hero && !a.is_hero) return 1;
      return (a.sort_order ?? 0) - (b.sort_order ?? 0);
    })
    .map((i) => i.image_url);

  const category = Array.isArray(property.categories) ? property.categories[0]?.name : property.categories?.name;
  const owner = property.profiles;
  const pricePerSqft = property.living_area_sqft && property.living_area_sqft > 0
    ? `${formatPropertyPrice(property.price / property.living_area_sqft)} / sqft`
    : null;

  const keyStats: { icon: keyof typeof Feather.glyphMap; label: string; value: string }[] = [];
  if (property.bedrooms != null) keyStats.push({ icon: 'home', label: 'Bedrooms', value: String(property.bedrooms) });
  if (property.bathrooms != null) keyStats.push({ icon: 'droplet', label: 'Bathrooms', value: String(property.bathrooms) });
  if (property.living_area_sqft != null) keyStats.push({ icon: 'maximize-2', label: 'Living Area', value: formatArea(property.living_area_sqft) });
  if (property.year_built != null) keyStats.push({ icon: 'calendar', label: 'Year Built', value: String(property.year_built) });

  const numOrDash = (v: number | null | undefined) => (v != null ? String(v) : '—');
  const boolOrDash = (v: boolean | null | undefined) => (v == null ? '—' : v ? 'Yes' : 'No');

  const features: { label: string; value: string }[] = [
    { label: 'Building Type', value: property.building_type ?? '—' },
    { label: 'Category', value: category ?? '—' },
    { label: 'Year Built', value: numOrDash(property.year_built) },
    { label: 'Living Area', value: property.living_area_sqft != null ? formatArea(property.living_area_sqft) : '—' },
    { label: 'Bedrooms', value: numOrDash(property.bedrooms) },
    { label: 'Bathrooms', value: numOrDash(property.bathrooms) },
    { label: 'Living Rooms', value: numOrDash(property.living_rooms) },
    { label: 'Kitchens', value: numOrDash(property.kitchens) },
    { label: 'Garage', value: boolOrDash(property.has_garage) },
    { label: 'Garden', value: boolOrDash(property.has_garden) },
  ];

  const fullAddress = [property.address, property.city, property.state].filter(Boolean).join(', ');

  const handleShare = async () => {
    if (!property) return;
    const priceLabel = formatPropertyPrice(property.price);
    const where = fullAddress || property.city || '';
    const message = where
      ? `${property.title} — ${priceLabel}\n${where}`
      : `${property.title} — ${priceLabel}`;
    try {
      await Share.share({ title: property.title, message });
    } catch {
      /* dismissed */
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }} showsVerticalScrollIndicator={false}>
        <View style={styles.heroContainer}>
          {images.length > 0 ? (
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              onMomentumScrollEnd={(e) => {
                setGalleryIndex(Math.round(e.nativeEvent.contentOffset.x / screenWidth));
              }}
            >
              {images.map((uri, i) => (
                <HeroImage key={i} uri={uri} width={screenWidth} />
              ))}
            </ScrollView>
          ) : (
            <View style={[styles.heroImage, styles.center, { width: screenWidth, backgroundColor: theme.colors.surface }]}>
              <Feather name="image" size={48} color={theme.colors.border} />
            </View>
          )}

          <View style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Feather name="arrow-left" size={24} color={theme.colors.onImage} />
            </TouchableOpacity>
            <View style={styles.heroOverlayRight}>
              <TouchableOpacity style={styles.iconBtn} onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share this listing">
                <Feather name="share-2" size={20} color={theme.colors.onImage} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => property && toggleFavorite(property.id)}>
                <Feather name="heart" size={22} color={isFavorite ? theme.colors.accent : theme.colors.onImage} />
              </TouchableOpacity>
            </View>
          </View>

          {images.length > 1 && (
            <>
              <View style={styles.galleryDots}>
                {images.map((_, i) => (
                  <View key={i} style={[styles.dot, i === galleryIndex && styles.dotActive]} />
                ))}
              </View>
              <View style={styles.galleryCounter}>
                <Feather name="image" size={14} color={theme.colors.onImage} />
                <Text style={styles.galleryCounterText}>{galleryIndex + 1} / {images.length}</Text>
              </View>
            </>
          )}
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.price}>{formatPropertyPrice(property.price)}</Text>
              {pricePerSqft && <Text style={styles.pricePerSqft}>{pricePerSqft}</Text>}
            </View>
            {property.ai_score != null && (
              <View style={styles.aiBadge}>
                <Feather name="cpu" size={14} color={theme.colors.textInverse} />
                <Text style={styles.aiBadgeText}>AI {property.ai_score.toFixed(1)}</Text>
              </View>
            )}
          </View>
          <Text style={styles.title}>{property.title}</Text>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={14} color={theme.colors.textSecondary} />
            <Text style={styles.address}>{fullAddress}</Text>
          </View>

          <View style={styles.statusRow}>
            {property.is_active && (
              <View style={[styles.statusBadge, styles.statusBadgeActive]}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>For Sale</Text>
              </View>
            )}
            <View style={styles.statusBadge}>
              <Feather name="clock" size={12} color={theme.colors.textSecondary} />
              <Text style={styles.statusTextMuted}>{formatRelativeDays(property.created_at)}</Text>
            </View>
          </View>

          {keyStats.length > 0 && (
            <View style={styles.keyStatsRow}>
              {keyStats.map((s) => (
                <View key={s.label} style={styles.keyStat}>
                  <Feather name={s.icon} size={20} color={theme.colors.tint} />
                  <Text style={styles.keyStatValue}>{s.value}</Text>
                  <Text style={styles.keyStatLabel}>{s.label}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={styles.tabContainer}>
            {(['Description', 'Features'] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && styles.activeTab]}
                onPress={() => setActiveTab(tab)}
              >
                <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {activeTab === 'Description' && (
            <View style={styles.tabContent}>
              <View>
                <Text style={styles.sectionTitle}>About this property</Text>
                <Text style={styles.description}>
                  {property.description ?? 'No description provided.'}
                </Text>
              </View>

              {property.ai_score_summary && (
                <View>
                  <Text style={styles.sectionTitle}>AI Insight</Text>
                  <Text style={styles.description}>{property.ai_score_summary}</Text>
                </View>
              )}
            </View>
          )}

          {activeTab === 'Features' && (
            <View style={styles.tabContent}>
              <View>
                <Text style={styles.sectionTitle}>Property Details</Text>
                {features.length === 0 ? (
                  <Text style={styles.description}>No additional details provided.</Text>
                ) : (
                  <View style={styles.featureGrid}>
                    {features.map((f) => (
                      <View key={f.label} style={styles.featureItem}>
                        <Text style={styles.featureLabel}>{f.label}</Text>
                        <Text style={styles.featureValue}>{f.value}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            </View>
          )}

        </View>
      </ScrollView>

      <PropertyBottomBar
        currentUserId={user?.id ?? null}
        owner={owner}
        propertyId={property.id}
      />
    </View>
  );
}

function PropertyBottomBar({
  currentUserId,
  owner,
  propertyId,
}: {
  currentUserId: string | null;
  owner: PropertyDetail['profiles'];
  propertyId: string;
}) {
  const { theme } = useUnistyles();

  const isOwnListing = !!currentUserId && !!owner && currentUserId === owner.id;
  const canContact = !isOwnListing && !!owner?.phone;

  if (isOwnListing) {
    return (
      <View style={styles.bottomBarWrap}>
        <View style={styles.ownListingNotice}>
          <Feather name="info" size={16} color={theme.colors.textSecondary} />
          <Text style={styles.ownListingText}>This is your listing.</Text>
        </View>
      </View>
    );
  }

  const handleCall = () => {
    if (!canContact || !owner?.phone) return;
    const phone = owner.phone;
    Linking.openURL(`tel:${phone}`);
  };

  const handleMessage = () => {
    if (!canContact || !owner?.phone) return;
    const url = Platform.OS === 'ios' ? `sms:${owner.phone}` : `smsto:${owner.phone}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.bottomBarWrap}>
      {!canContact && (
        <Text style={styles.bottomBarHint}>Phone not provided</Text>
      )}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.outlineBtn, !canContact && styles.outlineBtnDisabled]}
          onPress={handleMessage}
          disabled={!canContact}
          accessibilityRole="button"
          accessibilityLabel="Message owner"
        >
          <Feather name="message-circle" size={20} color={theme.colors.text} />
          <Text style={styles.outlineBtnText}>Message</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.solidBtn, !canContact && styles.solidBtnDisabled]}
          onPress={handleCall}
          disabled={!canContact}
          accessibilityRole="button"
          accessibilityLabel="Call owner"
        >
          <Feather name="phone-call" size={20} color={theme.colors.textInverse} />
          <Text style={styles.solidBtnText}>Call Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function HeroImage({ uri, width }: { uri: string; width: number }) {
  const [src, setSrc] = useState(uri || FALLBACK_IMAGE);
  useEffect(() => { setSrc(uri || FALLBACK_IMAGE); }, [uri]);
  return (
    <Image
      source={{ uri: src }}
      style={[styles.heroImage, { width }]}
      resizeMode="cover"
      onError={() => { if (src !== FALLBACK_IMAGE) setSrc(FALLBACK_IMAGE); }}
    />
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.textSecondary },

  heroContainer: { width: '100%', height: 350 },
  heroImage: { height: 350 },
  heroOverlay: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing(2) },
  heroOverlayRight: { flexDirection: 'row', gap: theme.spacing(1) },
  iconBtn: { width: 44, height: 44, borderRadius: theme.radii.round, backgroundColor: theme.colors.scrim, justifyContent: 'center', alignItems: 'center' },
  galleryDots: { position: 'absolute', bottom: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'center', gap: theme.spacing(0.5) },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.onImageMuted },
  dotActive: { width: 20, backgroundColor: theme.colors.onImage },
  galleryCounter: { position: 'absolute', bottom: 50, right: theme.spacing(2), flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), backgroundColor: theme.colors.scrim, paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.5), borderRadius: theme.radii.round },
  galleryCounterText: { ...theme.typography.caption, color: theme.colors.onImage, fontWeight: '600' },

  content: { padding: theme.spacing(3), backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, marginTop: -30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: theme.spacing(1) },
  price: { ...theme.typography.h1, color: theme.colors.tint },
  pricePerSqft: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.accent, paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.75), borderRadius: theme.radii.round, gap: theme.spacing(0.5) },
  aiBadgeText: { color: theme.colors.textInverse, ...theme.typography.caption, fontWeight: '700' },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing(0.5) },
  addressRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), marginBottom: theme.spacing(2) },
  address: { ...theme.typography.body, color: theme.colors.textSecondary, flex: 1 },

  statusRow: { flexDirection: 'row', gap: theme.spacing(1), marginBottom: theme.spacing(3) },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.75), borderRadius: theme.radii.round, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  statusBadgeActive: { backgroundColor: theme.colors.successBg, borderColor: theme.colors.success },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: theme.colors.success },
  statusText: { ...theme.typography.caption, color: theme.colors.success, fontWeight: '700' },
  statusTextMuted: { ...theme.typography.caption, color: theme.colors.textSecondary },

  keyStatsRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, padding: theme.spacing(2), gap: theme.spacing(1), marginBottom: theme.spacing(3), borderWidth: 1, borderColor: theme.colors.border },
  keyStat: { flex: 1, alignItems: 'center', gap: theme.spacing(0.5) },
  keyStatValue: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  keyStatLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, textAlign: 'center' },

  tabContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radii.round, padding: 4, marginBottom: theme.spacing(3) },
  tab: { flex: 1, paddingVertical: theme.spacing(1.5), alignItems: 'center', borderRadius: theme.radii.round },
  activeTab: { backgroundColor: theme.colors.background, ...theme.shadows.soft },
  tabText: { ...theme.typography.label, color: theme.colors.textSecondary },
  activeTabText: { color: theme.colors.text },
  tabContent: { gap: theme.spacing(3) },

  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing(1.5) },

  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 24, marginBottom: theme.spacing(1.5) },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  featureItem: { width: '47%', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  featureLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  featureValue: { ...theme.typography.label, color: theme.colors.text, fontWeight: '600' },

  bottomBarWrap: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.card, borderTopWidth: 1, borderTopColor: theme.colors.border },
  bottomBar: { flexDirection: 'row', padding: theme.spacing(2), paddingBottom: 30, gap: theme.spacing(2) },
  bottomBarHint: { ...theme.typography.caption, color: theme.colors.textMuted, textAlign: 'center', paddingTop: theme.spacing(1) },
  outlineBtn: { flex: 1, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  outlineBtnText: { ...theme.typography.label, color: theme.colors.text, fontWeight: '600' },
  solidBtn: { flex: 1.5, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  solidBtnDisabled: { opacity: 0.4 },
  outlineBtnDisabled: { opacity: 0.4 },
  solidBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '600' },
  ownListingNotice: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: theme.spacing(1), paddingVertical: theme.spacing(2), paddingBottom: theme.spacing(4) },
  ownListingText: { ...theme.typography.label, color: theme.colors.textSecondary },
}));
