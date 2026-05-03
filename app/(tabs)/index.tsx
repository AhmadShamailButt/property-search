import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Link, useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Input } from '@/components/ui/Input';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CategoryTabs } from '@/components/property/CategoryTabs';
import { BannerCarousel } from '@/components/property/BannerCarousel';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { useLocation } from '@/contexts/location-context';
import { useProperties, useBanners, useFavorites } from '@/hooks/useHomeData';
import { CATEGORIES } from '@/utils/filters';
import { useAuth } from '@/contexts/auth-context';

const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);
const HORIZONTAL_PADDING = 20;

export default function HomeScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();
  const { location } = useLocation();
  const { confirmSignOut } = useAuth();
  const [activeTab, setActiveTab] = useState<string>(CATEGORY_LABELS[0]);

  const { data: properties, isLoading: propsLoading, refresh } = useProperties({
    city: location?.city,
    category: activeTab,
  });
  const { data: banners, isLoading: bannersLoading } = useBanners();
  const { isFavorite, toggle } = useFavorites();

  const list = useMemo(() => properties ?? [], [properties]);
  const featuredCount = useMemo(() => list.filter((p) => p.featured).length, [list]);

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }, [refresh]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />
        }
      >
        <Animated.View entering={FadeInDown.delay(40)} style={styles.header}>
          <TouchableOpacity
            style={styles.locationPill}
            onPress={() => router.push('/location-picker')}
            activeOpacity={0.85}
          >
            <View style={styles.locationIconWrap}>
              <Feather name="map-pin" size={14} color={theme.colors.textInverse} />
            </View>
            <View style={{ flexShrink: 1 }}>
              <Text style={styles.locationLabel}>Current location</Text>
              <View style={styles.locationRow}>
                <Text style={styles.locationText} numberOfLines={1}>
                  {location ? `${location.city}${location.state ? `, ${location.state}` : ''}` : 'Set location'}
                </Text>
                <Feather name="chevron-down" size={16} color={theme.colors.text} />
              </View>
            </View>
          </TouchableOpacity>

          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.85}>
              <Feather name="bell" size={20} color={theme.colors.text} />
              <View style={styles.badge} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.notificationBtn} activeOpacity={0.85} onPress={confirmSignOut}>
              <Feather name="log-out" size={20} color={theme.colors.text} />
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120)} style={styles.searchSection}>
          <View style={styles.searchInputWrap}>
            <Link href="/search" asChild>
              <TouchableOpacity activeOpacity={0.85}>
                <View pointerEvents="none">
                  <Input icon="search" placeholder="Search for modern villas..." editable={false} />
                </View>
              </TouchableOpacity>
            </Link>
          </View>
          <Link href="/search" asChild>
            <TouchableOpacity style={styles.filterBtn} activeOpacity={0.85}>
              <Feather name="sliders" size={20} color={theme.colors.textInverse} />
            </TouchableOpacity>
          </Link>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(180)} style={{ marginBottom: theme.spacing(3) }}>
          {bannersLoading ? (
            <View style={[styles.bannerSkeleton]} />
          ) : banners && banners.length ? (
            <BannerCarousel items={banners} horizontalPadding={HORIZONTAL_PADDING} />
          ) : null}
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(240)} style={{ marginBottom: theme.spacing(2.5) }}>
          <CategoryTabs categories={CATEGORY_LABELS} activeCategory={activeTab} onSelect={setActiveTab} />
        </Animated.View>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>
            {location ? `Properties in ${location.city}` : 'All listings'}
          </Text>
          <Text style={styles.sectionCount}>
            {list.length} {list.length === 1 ? 'property' : 'properties'}
            {featuredCount > 0 ? ` · ${featuredCount} featured` : ''}
          </Text>
        </View>

        <View style={styles.grid}>
          {propsLoading ? (
            <>
              <PropertyCardSkeleton />
              <PropertyCardSkeleton />
            </>
          ) : list.length === 0 ? (
            <EmptyResults theme={theme} hasLocation={!!location} category={activeTab} />
          ) : (
            list.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(80 + i * 50)}>
                <PropertyCard
                  property={p}
                  isFavorite={isFavorite(p.id)}
                  onFavorite={() => toggle(p.id)}
                />
              </Animated.View>
            ))
          )}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const EmptyResults = ({ theme, hasLocation, category }: { theme: any; hasLocation: boolean; category: string }) => (
  <View style={styles.emptyWrap}>
    <View style={styles.emptyIcon}>
      <Feather name="home" size={28} color={theme.colors.textMuted} />
    </View>
    <Text style={styles.emptyTitle}>No properties yet</Text>
    <Text style={styles.emptySub}>
      {!hasLocation
        ? 'Set your location to see what’s nearby.'
        : category !== 'All'
        ? `No ${category.toLowerCase()} listings here yet — try a different category.`
        : 'Pull to refresh, or check back soon.'}
    </Text>
  </View>
);

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
    paddingTop: theme.spacing(2),
    paddingBottom: 180,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(2.5),
    gap: theme.spacing(1.5),
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(1),
    paddingVertical: theme.spacing(0.75),
  },
  locationIconWrap: {
    width: 36,
    height: 36,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  locationLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
  },
  locationText: {
    ...theme.typography.h3,
    color: theme.colors.text,
    flexShrink: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  badge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.accent,
  },

  searchSection: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
    marginBottom: theme.spacing(3),
    alignItems: 'center',
  },
  searchInputWrap: { flex: 1 },
  filterBtn: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.soft,
  },

  bannerSkeleton: {
    height: 180,
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.backgroundSecondary,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: theme.spacing(1.5),
    paddingHorizontal: 2,
  },
  sectionTitle: {
    ...theme.typography.h2,
    color: theme.colors.text,
  },
  sectionCount: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },


  grid: {
    gap: theme.spacing(0),
  },

  emptyWrap: {
    alignItems: 'center',
    paddingVertical: theme.spacing(5),
  },
  emptyIcon: {
    width: 60,
    height: 60,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing(2),
  },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary, marginBottom: theme.spacing(0.5) },
  emptySub: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: theme.spacing(3),
  },
}));
