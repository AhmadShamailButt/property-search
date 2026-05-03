import React, { useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { PropertyCard } from '@/components/property/PropertyCard';
import { CategoryTabs } from '@/components/property/CategoryTabs';
import { useSearch } from '@/hooks/useSearch';
import { CATEGORIES } from '@/utils/filters';

const CATEGORY_LABELS = CATEGORIES.map((c) => c.label);

export default function HomeScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();
  const { results, isLoading } = useSearch('');

  const goToSearch = useCallback(
    (params?: { category?: string }) =>
      router.push({ pathname: '/search', params: params ?? {} }),
    [router]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View>
            <Text style={styles.locationLabel}>Location</Text>
            <View style={styles.locationRow}>
              <Text style={styles.locationText}>Los Angeles, CA</Text>
              <Feather name="chevron-down" size={20} color={theme.colors.text} />
            </View>
          </View>
          <TouchableOpacity style={styles.notificationBtn}>
            <Feather name="bell" size={20} color={theme.colors.text} />
            <View style={styles.badge} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.searchSection}>
          <TouchableOpacity
            style={styles.searchInputWrap}
            activeOpacity={0.8}
            onPress={() => goToSearch()}
          >
            <View pointerEvents="none">
              <Input
                icon="search"
                placeholder="Search for Modern Villas..."
                style={styles.searchInput}
                editable={false}
              />
            </View>
          </TouchableOpacity>
          <TouchableOpacity style={styles.filterBtn} onPress={() => goToSearch()}>
            <Feather name="sliders" size={20} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400)}>
          <CategoryTabs
            categories={CATEGORY_LABELS}
            activeCategory="All"
            onSelect={(cat) => goToSearch(cat === 'All' ? undefined : { category: cat })}
            style={{ marginBottom: theme.spacing(3) }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.grid}>
          {isLoading && results.length === 0 ? (
            <ActivityIndicator color={theme.colors.tint} style={{ marginTop: theme.spacing(4) }} />
          ) : results.length === 0 ? (
            <Text style={styles.empty}>No properties available.</Text>
          ) : (
            results.map((prop) => <PropertyCard key={prop.id} property={prop} />)
          )}
        </Animated.View>

        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing(2.5) },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(3) },
  locationLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: theme.spacing(0.5) },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5) },
  locationText: { ...theme.typography.h3, color: theme.colors.text },
  notificationBtn: { width: 44, height: 44, borderRadius: theme.radii.round, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  badge: { position: 'absolute', top: 10, right: 12, width: 8, height: 8, borderRadius: 4, backgroundColor: theme.colors.accent },
  searchSection: { flexDirection: 'row', gap: theme.spacing(2), marginBottom: theme.spacing(3), alignItems: 'center' },
  searchInputWrap: { flex: 1 },
  searchInput: { paddingRight: 50 },
  filterBtn: { width: 56, height: 56, borderRadius: theme.radii.lg, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center' },
  grid: { gap: theme.spacing(3) },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing(4) },
}));
