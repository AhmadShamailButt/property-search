import React from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function FavoritesScreen() {
  const { theme } = StyleSheet.useTheme();
  
  // Empty state example or 1 item
  const hasFavorites = true;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Favorites</Text>
      </View>
      
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!hasFavorites ? (
          <View style={styles.emptyState}>
            <Feather name="heart" size={60} color={theme.colors.border} />
            <Text style={styles.emptyTitle}>No Favorites Yet</Text>
            <Text style={styles.emptySub}>Start exploring and save your favorite properties here.</Text>
          </View>
        ) : (
          <Animated.View entering={FadeInDown.delay(100)} style={styles.grid}>
            <View style={styles.card}>
              <View style={styles.cardImageContainer}>
                <Image source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80' }} style={styles.cardImage} />
                <View style={styles.favBtnActive}>
                  <Feather name="heart" fill={'#ffffff'} size={18} color={'#ffffff'} />
                </View>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardPrice}>$4,500,000</Text>
                <Text style={styles.cardTitle}>Modern Glass Villa</Text>
                <Text style={styles.cardAddress}>124 Beverly Hills, CA</Text>
              </View>
            </View>
            {/* Add height for bottom tab spacer */}
            <View style={{ height: 100 }} />
          </Animated.View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing(3), paddingBottom: theme.spacing(1) },
  title: { ...theme.typography.h1, color: theme.colors.text },
  scrollContent: { padding: theme.spacing(2.5), flexGrow: 1 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', opacity: 0.7 },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary, marginTop: theme.spacing(2) },
  emptySub: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center', marginTop: theme.spacing(1), paddingHorizontal: theme.spacing(4) },
  grid: { gap: theme.spacing(3) },
  card: { backgroundColor: theme.colors.card, borderRadius: theme.radii.lg, ...theme.shadows.soft, borderWidth: 1, borderColor: theme.colors.border },
  cardImageContainer: { height: 200, borderTopLeftRadius: theme.radii.lg, borderTopRightRadius: theme.radii.lg, overflow: 'hidden' },
  cardImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  favBtnActive: { position: 'absolute', top: theme.spacing(1.5), right: theme.spacing(1.5), width: 36, height: 36, borderRadius: theme.radii.round, backgroundColor: theme.colors.accent, justifyContent: 'center', alignItems: 'center' },
  cardContent: { padding: theme.spacing(2) },
  cardPrice: { ...theme.typography.h2, color: theme.colors.tint, marginBottom: theme.spacing(0.5) },
  cardTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing(0.5) },
  cardAddress: { ...theme.typography.caption, color: theme.colors.textSecondary },
}));
