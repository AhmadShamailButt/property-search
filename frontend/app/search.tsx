import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
// Optional: import BottomSheet from '@gorhom/bottom-sheet'; if we add it, but mock it here

export default function SearchScreen() {
  const { theme } = StyleSheet.useTheme();
  const [showFilters, setShowFilters] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <Feather name="search" size={20} color={theme.colors.icon} />
          <TextInput style={styles.searchInput} placeholder="San Francisco..." placeholderTextColor={theme.colors.textMuted} defaultValue="Villa" />
        </View>
        <TouchableOpacity style={styles.filterBtn} onPress={() => setShowFilters(true)}>
          <Feather name="sliders" size={20} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>

      <View style={styles.resultsHeader}>
        <Text style={styles.resultsCount}>742 Ads Found</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <View style={styles.chip}><Text style={styles.chipText}>Price: $1M - $5M</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Type: Villa</Text></View>
          <View style={styles.chip}><Text style={styles.chipText}>Rooms: 4+</Text></View>
        </ScrollView>
      </View>

      <ScrollView contentContainerStyle={styles.grid}>
        <View style={styles.card}>
          <View style={styles.cardImageContainer}>
            <Image source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3' }} style={styles.cardImage} />
            <View style={styles.favBtn}>
              <Feather name="heart" size={18} color="#fff" />
            </View>
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardPrice}>$4,500,000</Text>
            <Text style={styles.cardTitle}>Modern Glass Villa</Text>
            <Text style={styles.cardAddress}>124 Beverly Hills, CA</Text>
          </View>
        </View>
      </ScrollView>

      {/* Filter Bottom Sheet Mock */}
      {showFilters && (
        <View style={styles.bottomSheetOverlay}>
          <View style={styles.bottomSheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Filter & Sort</Text>
              <TouchableOpacity onPress={() => setShowFilters(false)}>
                <Feather name="x" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: theme.spacing(3), gap: theme.spacing(3) }}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                {['All', 'Villa', 'Apartment', 'House'].map(c => (
                  <TouchableOpacity key={c} style={styles.filterChip}><Text>{c}</Text></TouchableOpacity>
                ))}
              </View>
              
              <Text style={styles.filterLabel}>Price Range</Text>
              <View style={{ height: 20, backgroundColor: theme.colors.border, borderRadius: 10, marginVertical: 10 }} />
              
              <Text style={styles.filterLabel}>Sort By</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {['Newest', 'Recommended', 'Highest', 'Lowest Price'].map(c => (
                  <TouchableOpacity key={c} style={styles.filterChip}><Text>{c}</Text></TouchableOpacity>
                ))}
              </View>

              <Text style={styles.filterLabel}>Living Area (sqft)</Text>
              <View style={{ height: 20, backgroundColor: theme.colors.border, borderRadius: 10, marginVertical: 10 }} />

              <View style={{ flexDirection: 'row', gap: 20, marginTop: 20 }}>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 1, backgroundColor: theme.colors.surface }]}><Text style={{ color: theme.colors.text }}>Reset</Text></TouchableOpacity>
                <TouchableOpacity style={[styles.primaryBtn, { flex: 2 }]} onPress={() => setShowFilters(false)}><Text style={{ color: '#fff' }}>Apply Filters</Text></TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      )}
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
  resultsHeader: { padding: theme.spacing(2) },
  resultsCount: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing(2) },
  chips: { gap: theme.spacing(1) },
  chip: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(0.75), borderRadius: theme.radii.round, backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  chipText: { ...theme.typography.caption, color: theme.colors.text },
  grid: { padding: theme.spacing(2), gap: theme.spacing(3) },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  cardImageContainer: { height: 200, borderTopLeftRadius: theme.radii.lg, borderTopRightRadius: theme.radii.lg, overflow: 'hidden' },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  favBtn: { position: 'absolute', top: 10, right: 10, width: 36, height: 36, borderRadius: theme.radii.round, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: theme.spacing(2) },
  cardPrice: { ...theme.typography.h2, color: theme.colors.tint },
  cardTitle: { ...theme.typography.body, color: theme.colors.text },
  cardAddress: { ...theme.typography.caption, color: theme.colors.textSecondary },
  // Bottom Sheet
  bottomSheetOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end', zIndex: 100 },
  bottomSheet: { backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, height: '80%' },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing(3), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  sheetTitle: { ...theme.typography.h2, color: theme.colors.text },
  filterLabel: { ...theme.typography.label, color: theme.colors.text, marginTop: theme.spacing(2) },
  filterChip: { padding: 10, backgroundColor: theme.colors.surface, borderRadius: 10, borderWidth: 1, borderColor: theme.colors.border },
  primaryBtn: { height: 50, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center' },
}));
