import React, { useState } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Feather, FontAwesome5 } from '@expo/vector-icons';
import { router, Link } from 'expo-router';

export default function PropertyDetailScreen() {
  const { theme } = StyleSheet.useTheme();
  const [activeTab, setActiveTab] = useState<'Description' | 'Features'>('Description');

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        {/* PARALLAX HERO placeholder */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3' }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn}>
              <Feather name="arrow-left" size={24} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn}>
              <Feather name="heart" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.price}>$4,500,000</Text>
            <View style={styles.aiBadge}>
              <Feather name="cpu" size={14} color="#fff" />
              <Text style={styles.aiBadgeText}>AI Score: 9.8</Text>
            </View>
          </View>
          <Text style={styles.title}>Modern Glass Villa</Text>
          <Text style={styles.address}><Feather name="map-pin" size={14} /> 124 Beverly Hills, CA</Text>

          {/* TAB SWITCHER */}
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tab, activeTab === 'Description' && styles.activeTab]} onPress={() => setActiveTab('Description')}>
              <Text style={[styles.tabText, activeTab === 'Description' && styles.activeTabText]}>Description</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tab, activeTab === 'Features' && styles.activeTab]} onPress={() => setActiveTab('Features')}>
              <Text style={[styles.tabText, activeTab === 'Features' && styles.activeTabText]}>Features</Text>
            </TouchableOpacity>
          </View>

          {/* CONTENT BASED ON TAB */}
          {activeTab === 'Description' ? (
            <View style={styles.tabContent}>
              <View style={styles.ownerCard}>
                <Image source={{ uri: 'https://i.pravatar.cc/150?u=owner1' }} style={styles.ownerAvatar} />
                <View style={styles.ownerInfo}>
                  <Text style={styles.ownerName}>Sarah Jenkins</Text>
                  <Text style={styles.ownerMember}>Member since 2021</Text>
                </View>
                <TouchableOpacity style={styles.viewProfileBtn}><Text style={styles.viewProfileText}>Profile</Text></TouchableOpacity>
              </View>
              <Text style={styles.description}>
                This gorgeous modern glass villa offers breathtaking panoramic views of the city. Custom built in 2022, featuring high-end fixtures...
              </Text>

              {/* RAG CHAT PROMO */}
              <Link href="/property/1/ai-chat" asChild>
                <TouchableOpacity style={styles.ragPromo}>
                  <View style={styles.ragPromoIcon}><Feather name="message-square" size={24} color={theme.colors.tint} /></View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.ragPromoTitle}>Ask AI about this property</Text>
                    <Text style={styles.ragPromoSub}>Get instant answers from our AI model</Text>
                  </View>
                  <Feather name="chevron-right" size={24} color={theme.colors.icon} />
                </TouchableOpacity>
              </Link>
            </View>
          ) : (
            <View style={styles.tabContent}>
              <View style={styles.featureGrid}>
                <View style={styles.featureItem}><Text style={styles.featureLabel}>Building Type</Text><Text style={styles.featureValue}>Villa</Text></View>
                <View style={styles.featureItem}><Text style={styles.featureLabel}>Year Built</Text><Text style={styles.featureValue}>2022</Text></View>
                <View style={styles.featureItem}><Text style={styles.featureLabel}>Living Area</Text><Text style={styles.featureValue}>4,200 sqft</Text></View>
              </View>

              <Text style={styles.amenitiesTitle}>Amenities</Text>
              <View style={styles.amenitiesGrid}>
                {['Bedrooms', 'Living Rooms', 'Bathrooms', 'Kitchen', 'Garage', 'Garden'].map(amenity => (
                  <View key={amenity} style={styles.amenityBadge}>
                    <Feather name="check" size={16} color={theme.colors.tint} />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FIXED BOTTOM CTA */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.outlineBtn}>
          <Feather name="message-circle" size={20} color={theme.colors.text} />
          <Text style={styles.outlineBtnText}>Chat</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.solidBtn}>
          <Feather name="phone-call" size={20} color="#fff" />
          <Text style={styles.solidBtnText}>Call Owner</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  heroContainer: { width: '100%', height: 350 },
  heroImage: { ...StyleSheet.absoluteFillObject, width: '100%', height: '100%' },
  heroOverlay: { position: 'absolute', top: 50, left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: theme.spacing(2) },
  iconBtn: { width: 44, height: 44, borderRadius: theme.radii.round, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  content: { padding: theme.spacing(3), backgroundColor: theme.colors.background, borderTopLeftRadius: theme.radii.xl, borderTopRightRadius: theme.radii.xl, marginTop: -30 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: theme.spacing(1) },
  price: { ...theme.typography.h1, color: theme.colors.tint },
  aiBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.accent, paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.5), borderRadius: theme.radii.round, gap: theme.spacing(0.5) },
  aiBadgeText: { color: '#fff', ...theme.typography.caption, fontWeight: '700' },
  title: { ...theme.typography.h2, color: theme.colors.text, marginBottom: theme.spacing(1) },
  address: { ...theme.typography.body, color: theme.colors.textSecondary, marginBottom: theme.spacing(3) },
  tabContainer: { flexDirection: 'row', backgroundColor: theme.colors.surface, borderRadius: theme.radii.round, padding: 4, marginBottom: theme.spacing(3) },
  tab: { flex: 1, paddingVertical: theme.spacing(1.5), alignItems: 'center', borderRadius: theme.radii.round },
  activeTab: { backgroundColor: theme.colors.background, ...theme.shadows.soft },
  tabText: { ...theme.typography.label, color: theme.colors.textSecondary },
  activeTabText: { color: theme.colors.text },
  tabContent: { gap: theme.spacing(3) },
  ownerCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  ownerAvatar: { width: 50, height: 50, borderRadius: theme.radii.round, marginRight: theme.spacing(2) },
  ownerInfo: { flex: 1 },
  ownerName: { ...theme.typography.label, color: theme.colors.text },
  ownerMember: { ...theme.typography.caption, color: theme.colors.textMuted },
  viewProfileBtn: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1), borderRadius: theme.radii.round, backgroundColor: theme.colors.background, borderWidth: 1, borderColor: theme.colors.border },
  viewProfileText: { ...theme.typography.caption, color: theme.colors.text },
  description: { ...theme.typography.body, color: theme.colors.textSecondary, lineHeight: 24 },
  ragPromo: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.tint, gap: theme.spacing(2) },
  ragPromoIcon: { width: 48, height: 48, borderRadius: theme.radii.round, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center' },
  ragPromoTitle: { ...theme.typography.label, color: theme.colors.text },
  ragPromoSub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  featureGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2) },
  featureItem: { width: '47%', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  featureLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 4 },
  featureValue: { ...theme.typography.label, color: theme.colors.text },
  amenitiesTitle: { ...theme.typography.h3, color: theme.colors.text, marginTop: theme.spacing(2) },
  amenitiesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(1.5) },
  amenityBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1), borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(1) },
  amenityText: { ...theme.typography.label, color: theme.colors.text },
  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: theme.colors.card, flexDirection: 'row', padding: theme.spacing(2), paddingBottom: 30, gap: theme.spacing(2), borderTopWidth: 1, borderTopColor: theme.colors.border },
  outlineBtn: { flex: 1, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.border, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  outlineBtnText: { ...theme.typography.label, color: theme.colors.text },
  solidBtn: { flex: 1.5, flexDirection: 'row', height: 56, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center', gap: theme.spacing(1) },
  solidBtnText: { ...theme.typography.label, color: '#fff' },
}));
