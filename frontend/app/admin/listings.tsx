import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

export default function AdminListingsScreen() {
  const { theme } = StyleSheet.useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Listings</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Feather name="plus" size={20} color="#fff" />
          <Text style={styles.addBtnText}>New</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.tableRow}>
          <Image source={{ uri: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3' }} style={styles.img} />
          <View style={styles.info}>
            <Text style={styles.propTitle}>Modern Glass Villa</Text>
            <View style={styles.badges}>
              <View style={styles.statusBadge}><Text style={styles.statusText}>Active</Text></View>
              <View style={styles.featuredBadge}><Text style={styles.featuredText}>Featured</Text></View>
            </View>
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
  tableRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: theme.spacing(2) },
  img: { width: 60, height: 60, borderRadius: theme.radii.md, marginRight: theme.spacing(2) },
  info: { flex: 1 },
  propTitle: { ...theme.typography.label, color: theme.colors.text, marginBottom: 4 },
  badges: { flexDirection: 'row', gap: theme.spacing(1) },
  statusBadge: { backgroundColor: theme.colors.success + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { ...theme.typography.caption, color: theme.colors.success },
  featuredBadge: { backgroundColor: theme.colors.accent + '20', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  featuredText: { ...theme.typography.caption, color: theme.colors.accent },
  actions: { flexDirection: 'row', gap: theme.spacing(2) },
}));
