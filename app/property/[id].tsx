import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, useWindowDimensions, ActivityIndicator } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router, Link, useLocalSearchParams } from 'expo-router';
import { Image } from 'expo-image';

import { supabase } from '@/utils/supabase';
import { formatArea } from '@/utils/filters';

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
  latitude: number | null;
  longitude: number | null;
  categories: { name: string } | { name: string }[] | null;
  property_images: { image_url: string; is_hero: boolean | null; sort_order: number | null }[] | null;
  profiles: { full_name: string; avatar_url: string | null; created_at: string } | null;
};

const formatFullPrice = (v: number) => `$${Math.round(v).toLocaleString('en-US')}`;

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

  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'Description' | 'Features' | 'Location'>('Description');
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);

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
          ai_score, ai_score_summary, created_at, latitude, longitude,
          categories(name),
          property_images(image_url, is_hero, sort_order),
          profiles!properties_owner_id_fkey(full_name, avatar_url, created_at)
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
    ? `${formatFullPrice(property.price / property.living_area_sqft)} / sqft`
    : null;

  const keyStats: { icon: keyof typeof Feather.glyphMap; label: string; value: string }[] = [];
  if (property.bedrooms != null) keyStats.push({ icon: 'home', label: 'Bedrooms', value: String(property.bedrooms) });
  if (property.bathrooms != null) keyStats.push({ icon: 'droplet', label: 'Bathrooms', value: String(property.bathrooms) });
  if (property.living_area_sqft != null) keyStats.push({ icon: 'maximize-2', label: 'Living Area', value: formatArea(property.living_area_sqft) });
  if (property.year_built != null) keyStats.push({ icon: 'calendar', label: 'Year Built', value: String(property.year_built) });

  const features: { label: string; value: string }[] = [];
  if (property.building_type) features.push({ label: 'Building Type', value: property.building_type });
  if (category) features.push({ label: 'Category', value: category });
  if (property.year_built != null) features.push({ label: 'Year Built', value: String(property.year_built) });
  if (property.living_area_sqft != null) features.push({ label: 'Living Area', value: formatArea(property.living_area_sqft) });
  if (property.bedrooms != null) features.push({ label: 'Bedrooms', value: String(property.bedrooms) });
  if (property.bathrooms != null) features.push({ label: 'Bathrooms', value: String(property.bathrooms) });
  if (property.living_rooms != null) features.push({ label: 'Living Rooms', value: String(property.living_rooms) });
  if (property.kitchens != null) features.push({ label: 'Kitchens', value: String(property.kitchens) });
  if (property.has_garage != null) features.push({ label: 'Garage', value: property.has_garage ? 'Yes' : 'No' });
  if (property.has_garden != null) features.push({ label: 'Garden', value: property.has_garden ? 'Yes' : 'No' });

  const fullAddress = [property.address, property.city, property.state].filter(Boolean).join(', ');
  const ownerSinceYear = owner ? new Date(owner.created_at).getFullYear() : null;

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
                <Image key={i} source={uri} style={[styles.heroImage, { width: screenWidth }]} />
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
              <TouchableOpacity style={styles.iconBtn}>
                <Feather name="share-2" size={20} color={theme.colors.onImage} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={() => setIsFavorite(!isFavorite)}>
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
              <Text style={styles.price}>{formatFullPrice(property.price)}</Text>
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
            {(['Description', 'Features', 'Location'] as const).map((tab) => (
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
              {owner && (
                <View style={styles.ownerCard}>
                  {owner.avatar_url ? (
                    <Image source={owner.avatar_url} style={styles.ownerAvatar} />
                  ) : (
                    <View style={[styles.ownerAvatar, styles.center, { backgroundColor: theme.colors.surface }]}>
                      <Feather name="user" size={24} color={theme.colors.icon} />
                    </View>
                  )}
                  <View style={styles.ownerInfo}>
                    <Text style={styles.ownerName}>{owner.full_name}</Text>
                    {ownerSinceYear && <Text style={styles.ownerMember}>Member since {ownerSinceYear}</Text>}
                  </View>
                </View>
              )}

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

              <Link href={`/property/${property.id}/ai-chat`} asChild>
                <TouchableOpacity style={styles.ragPromo}>
                  <View style={styles.ragPromoIcon}>
                    <Feather name="message-square" size={24} color={theme.colors.tint} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ragPromoTitle}>Ask AI about this property</Text>
                    <Text style={styles.ragPromoSub}>Get instant answers from our AI model</Text>
                  </View>
                  <Feather name="chevron-right" size={24} color={theme.colors.icon} />
                </TouchableOpacity>
              </Link>
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

          {activeTab === 'Location' && (
            <View style={styles.tabContent}>
              <View style={styles.mapPlaceholder}>
                <Feather name="map" size={48} color={theme.colors.border} />
                <Text style={styles.mapText}>Map preview</Text>
                {property.latitude != null && property.longitude != null && (
                  <Text style={styles.mapSub}>
                    {property.latitude.toFixed(4)}, {property.longitude.toFixed(4)}
                  </Text>
                )}
              </View>

              <View>
                <Text style={styles.sectionTitle}>Address</Text>
                <Text style={styles.description}>{fullAddress}</Text>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.outlineBtn}>
          <Feather name="message-circle" size={20} color={theme.colors.text} />
          <Text style={styles.outlineBtnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.solidBtn}>
          <Feather name="phone-call" size={20} color={theme.colors.textInverse} />
          <Text style={styles.solidBtnText}>Call Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
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

  ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(1.5) },
  ownerAvatar: { width: 56, height: 56, borderRadius: theme.radii.round },
  ownerInfo: { flex: 1, gap: 2 },
  ownerName: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  ownerMember: { ...theme.typography.caption, color: theme.colors.textMuted },

  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 24, marginBottom: theme.spacing(1.5) },

  ragPromo: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.tint, gap: theme.spacing(2) },
  ragPromoIcon: { width: 48, height: 48, borderRadius: theme.radii.round, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  ragPromoTitle: { ...theme.typography.label, color: theme.colors.text, fontWeight: '600' },
  ragPromoSub: { ...theme.typography.caption, color: theme.colors.textSecondary },

  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  featureItem: { width: '47%', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  featureLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  featureValue: { ...theme.typography.label, color: theme.colors.text, fontWeight: '600' },

  mapPlaceholder: { height: 200, backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  mapText: { ...theme.typography.label, color: theme.colors.textSecondary },
  mapSub: { ...theme.typography.caption, color: theme.colors.textMuted },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.card, flexDirection: 'row', padding: theme.spacing(2), paddingBottom: 30, gap: theme.spacing(2), borderTopWidth: 1, borderTopColor: theme.colors.border },
  outlineBtn: { flex: 1, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  outlineBtnText: { ...theme.typography.label, color: theme.colors.text, fontWeight: '600' },
  solidBtn: { flex: 1.5, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  solidBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '600' },
}));
