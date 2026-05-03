import React, { useCallback, useState } from 'react';
import { View, Text, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { PropertyCard } from '@/components/property/PropertyCard';
import { PropertyCardSkeleton } from '@/components/property/PropertyCardSkeleton';
import { useFavoriteProperties, useFavorites } from '@/hooks/useHomeData';

export default function FavoritesScreen() {
  const { theme } = useUnistyles();
  const { data: favorites, isLoading, error, refresh } = useFavoriteProperties();
  const { isFavorite, toggle } = useFavorites();

  const [refreshing, setRefreshing] = useState(false);
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    refresh();
    setTimeout(() => setRefreshing(false), 600);
  }, [refresh]);

  const showSkeletons = isLoading && !favorites;
  const isEmpty = !showSkeletons && (!favorites || favorites.length === 0);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
        {favorites && favorites.length > 0 ? (
          <Text style={styles.subtitle}>
            {favorites.length} {favorites.length === 1 ? 'property' : 'properties'} saved
          </Text>
        ) : null}
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />
        }
      >
        {error ? (
          <View style={styles.emptyState}>
            <Feather name="alert-circle" size={48} color={theme.colors.error} />
            <Text style={styles.emptyTitle}>Couldn’t load favorites</Text>
            <Text style={styles.emptySub}>{error}</Text>
          </View>
        ) : showSkeletons ? (
          <View style={styles.grid}>
            <PropertyCardSkeleton />
            <PropertyCardSkeleton />
          </View>
        ) : isEmpty ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Feather name="heart" size={36} color={theme.colors.textMuted} />
            </View>
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySub}>
              Tap the heart on any property to save it here for later.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {favorites!.map((p, i) => (
              <Animated.View key={p.id} entering={FadeInDown.delay(60 + i * 40)}>
                <PropertyCard
                  property={p}
                  isFavorite={isFavorite(p.id)}
                  onFavorite={() => toggle(p.id)}
                />
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(2), paddingBottom: theme.spacing(1) },
  title: { ...theme.typography.h1, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(0.5) },
  scrollContent: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(1.5), paddingBottom: 140, flexGrow: 1 },
  grid: { gap: theme.spacing(0) },

  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(4),
    paddingTop: theme.spacing(8),
    gap: theme.spacing(1),
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
  },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary, marginTop: theme.spacing(1) },
  emptySub: {
    ...theme.typography.body,
    color: theme.colors.textMuted,
    textAlign: 'center',
    marginTop: theme.spacing(0.5),
  },
}));
