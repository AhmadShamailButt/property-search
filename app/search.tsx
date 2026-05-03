import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { FilterSheet } from '@/components/property/FilterSheet';
import { PropertyCard } from '@/components/property/PropertyCard';
import { Chip } from '@/components/ui/Chip';
import { useSearch } from '@/hooks/useSearch';
import { useFavorites } from '@/hooks/useHomeData';
import { activeFilterChips, removeFilterChip } from '@/utils/filters';

export default function SearchScreen() {
  const { theme } = useUnistyles();
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const { filters, setFilters, results, count, isLoading, error } = useSearch(query);
  const { isFavorite, toggle } = useFavorites();

  const chips = activeFilterChips(filters);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.colors.icon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search properties..."
            placeholderTextColor={theme.colors.textMuted}
            value={query}
            onChangeText={setQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Feather name="sliders" size={20} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>
          {isLoading ? 'Searching…' : `${count} ${count === 1 ? 'Ad' : 'Ads'} Found`}
        </Text>
        {chips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
            {chips.map((c) => (
              <Chip
                key={c.key}
                label={c.label}
                size="sm"
                onRemove={() => setFilters(removeFilterChip(filters, c))}
              />
            ))}
          </ScrollView>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        {error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : isLoading && results.length === 0 ? (
          <ActivityIndicator color={theme.colors.tint} style={{ marginTop: theme.spacing(4) }} />
        ) : results.length === 0 ? (
          <Text style={styles.empty}>No properties match your filters.</Text>
        ) : (
          results.map((p) => (
            <PropertyCard
              key={p.id}
              property={p}
              isFavorite={isFavorite(p.id)}
              onFavorite={() => toggle(p.id)}
            />
          ))
        )}
      </ScrollView>

      <FilterSheet
        visible={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        onApply={setFilters}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing(2), gap: theme.spacing(2) },
  backBtn: { padding: theme.spacing(1) },
  searchContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radii.round, paddingHorizontal: theme.spacing(2), height: 44, borderWidth: 1, borderColor: theme.colors.border },
  searchInput: { flex: 1, marginLeft: theme.spacing(1), color: theme.colors.text },
  filterBtn: { width: 44, height: 44, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center' },
  resultsHeader: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(1), gap: theme.spacing(1.5) },
  resultsCount: { ...theme.typography.h3, color: theme.colors.text },
  chips: { gap: theme.spacing(1), paddingRight: theme.spacing(2) },
  grid: { padding: theme.spacing(2) },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing(4) },
}));
