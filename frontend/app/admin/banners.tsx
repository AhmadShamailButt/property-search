import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

export default function AdminBannersScreen() {
  const { theme } = StyleSheet.useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Banners</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.bannerCard}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?ixlib=rb-4.0.3' }} style={styles.bannerImg} />
          <View style={styles.bannerInfo}>
            <Text style={styles.bannerTitle}>Find your dream home today</Text>
            <Text style={styles.bannerSub}>Get 10% off closing...</Text>
          </View>
          <View style={styles.actions}>
            <TouchableOpacity><Feather name="edit" size={20} color={theme.colors.tint} /></TouchableOpacity>
            <TouchableOpacity><Feather name="trash-2" size={20} color={theme.colors.error} /></TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing(3) },
  title: { ...theme.typography.h2, color: theme.colors.text },
  addBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.tint, paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1), borderRadius: theme.radii.round, gap: theme.spacing(1) },
  addBtnText: { ...theme.typography.label, color: '#fff' },
  scroll: { padding: theme.spacing(2) },
  bannerCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, overflow: 'hidden', marginBottom: theme.spacing(2) },
  bannerImg: { width: '100%', height: 120 },
  bannerInfo: { padding: theme.spacing(2) },
  bannerTitle: { ...theme.typography.label, color: theme.colors.text },
  bannerSub: { ...theme.typography.caption, color: theme.colors.textSecondary },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', padding: theme.spacing(2), borderTopWidth: 1, borderTopColor: theme.colors.border, gap: theme.spacing(3) },
}));
