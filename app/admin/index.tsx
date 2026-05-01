import React from 'react';
import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';

export default function AdminDashboardScreen() {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Admin Dashboard</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Feather name="calendar" size={20} color={theme.colors.text} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.summaryGrid}>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>1,204</Text>
            <Text style={styles.summaryLabel}>Total Listings</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>8,492</Text>
            <Text style={styles.summaryLabel}>Total Users</Text>
          </View>
          <View style={styles.summaryCard}>
            <Text style={styles.summaryValue}>45.2k</Text>
            <Text style={styles.summaryLabel}>Total Searches</Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Most Used Filters</Text>
          <View style={styles.chartCard}>
            <View style={styles.barRow}><Text style={styles.barLabel}>Price</Text><View style={styles.barTrack}><View style={[styles.barFill, { width: '80%' }]} /></View></View>
            <View style={styles.barRow}><Text style={styles.barLabel}>Type</Text><View style={styles.barTrack}><View style={[styles.barFill, { width: '60%' }]} /></View></View>
            <View style={styles.barRow}><Text style={styles.barLabel}>Rooms</Text><View style={styles.barTrack}><View style={[styles.barFill, { width: '40%' }]} /></View></View>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.chartSection}>
          <Text style={styles.sectionTitle}>Conversion Metrics</Text>
          <View style={styles.metricsCard}>
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Filter Drop-off Rate</Text>
              <Text style={styles.metricValueErr}>24%</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.metricRow}>
              <Text style={styles.metricLabel}>Filter → Listing Conversion</Text>
              <Text style={styles.metricValueSucc}>68%</Text>
            </View>
          </View>
        </Animated.View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: theme.spacing(3) },
  title: { ...theme.typography.h1, color: theme.colors.text },
  iconBtn: { padding: theme.spacing(1), borderWidth: 1, borderColor: theme.colors.border, borderRadius: theme.radii.round },
  scroll: { padding: theme.spacing(2) },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing(2), marginBottom: theme.spacing(3) },
  summaryCard: { flex: 1, minWidth: '30%', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center' },
  summaryValue: { ...theme.typography.h2, color: theme.colors.tint, marginBottom: 4 },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },
  chartSection: { marginBottom: theme.spacing(3) },
  sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing(1.5) },
  chartCard: { backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, gap: theme.spacing(2) },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2) },
  barLabel: { width: 50, ...theme.typography.label, color: theme.colors.textSecondary },
  barTrack: { flex: 1, height: 16, backgroundColor: theme.colors.background, borderRadius: theme.radii.round, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.colors.tint },
  metricsCard: { backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  metricRow: { flexDirection: 'row', justifyContent: 'space-between', padding: theme.spacing(2) },
  divider: { height: 1, backgroundColor: theme.colors.border },
  metricLabel: { ...theme.typography.body, color: theme.colors.text },
  metricValueErr: { ...theme.typography.h3, color: theme.colors.error },
  metricValueSucc: { ...theme.typography.h3, color: theme.colors.success },
}));
