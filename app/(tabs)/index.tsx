import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown, FadeInRight } from 'react-native-reanimated';

import { Input } from '../../components/ui/Input';
import { PropertyCard, Property } from '../../components/property/PropertyCard';
import { CategoryTabs } from '../../components/property/CategoryTabs';

const CATEGORIES = ['All', 'Villa', 'Apartment', 'House'];

const PROPERTIES: Property[] = [
  {
    id: '1',
    title: 'Modern Glass Villa',
    address: '124 Beverly Hills, CA',
    price: '$4,500,000',
    type: 'Villa',
    featured: true,
    image: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  },
  {
    id: '2',
    title: 'Minimalist Apartment',
    address: '89 NYC, New York',
    price: '$1,200,000',
    type: 'Apartment',
    featured: false,
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
  }
];

export default function HomeScreen() {
  const { theme } = useUnistyles();
  const [activeTab, setActiveTab] = useState('All');

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
          <View style={styles.searchInputWrap}>
            <Input
              icon="search"
              placeholder="Search for Modern Villas..."
              style={styles.searchInput}
            />
          </View>
          <TouchableOpacity style={styles.filterBtn}>
            <Feather name="sliders" size={20} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.bannerContainer}>
          <Image 
            source={{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} 
            style={styles.bannerImage} 
          />
          <View style={styles.bannerOverlay}>
            <Text style={styles.bannerTitle}>Find your dream home today</Text>
            <Text style={styles.bannerSubtitle}>Get 10% off closing costs on featured houses</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInRight.delay(400)}>
          <CategoryTabs 
            categories={CATEGORIES} 
            activeCategory={activeTab} 
            onSelect={setActiveTab} 
            style={{ marginBottom: theme.spacing(3) }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(500)} style={styles.grid}>
          {PROPERTIES.map((prop) => (
            <PropertyCard key={prop.id} property={prop} />
          ))}
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
  bannerContainer: { height: 160, borderRadius: theme.radii.lg, overflow: 'hidden', marginBottom: theme.spacing(3) },
  bannerImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  bannerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', padding: theme.spacing(2.5), justifyContent: 'center' },
  bannerTitle: { ...theme.typography.h2, color: '#ffffff', marginBottom: theme.spacing(0.5) },
  bannerSubtitle: { ...theme.typography.body, color: 'rgba(255,255,255,0.8)' },
  grid: { gap: theme.spacing(3) },
}));
