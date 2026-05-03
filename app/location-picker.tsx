import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeInDown, FadeIn } from 'react-native-reanimated';

import { Input } from '@/components/ui/Input';
import { useLocation, SUPPORTED_CITIES, formatLocation, type AppLocation } from '@/contexts/location-context';

export default function LocationPickerScreen() {
  const { theme } = useUnistyles();
  const { location, setLocation } = useLocation();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SUPPORTED_CITIES;
    return SUPPORTED_CITIES.filter((c) =>
      `${c.city} ${c.state ?? ''}`.toLowerCase().includes(q),
    );
  }, [query]);

  const handleSelect = async (loc: AppLocation) => {
    await setLocation(loc);
    router.back();
  };

  const handleCustom = async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    const parts = trimmed.split(',').map((s) => s.trim());
    await handleSelect({ city: parts[0], state: parts[1], country: parts[2] ?? 'USA' });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={8}>
          <Feather name="x" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Choose location</Text>
        <View style={{ width: 38 }} />
      </View>

      <View style={styles.searchWrap}>
        <Input
          icon="search"
          placeholder="Search city or area"
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={handleCustom}
          autoCapitalize="words"
          returnKeyType="done"
        />
      </View>

      <ScrollView contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeIn.duration(220)} style={styles.sectionLabelRow}>
          <Feather name="map-pin" size={14} color={theme.colors.textSecondary} />
          <Text style={styles.sectionLabel}>Popular cities</Text>
        </Animated.View>

        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyTitle}>No matches</Text>
            <Text style={styles.emptySub}>Press done to use “{query.trim()}” anyway.</Text>
            <TouchableOpacity style={styles.useCustomBtn} onPress={handleCustom}>
              <Text style={styles.useCustomBtnText}>Use “{query.trim()}”</Text>
            </TouchableOpacity>
          </View>
        ) : (
          filtered.map((loc, i) => {
            const selected = location?.city === loc.city && location?.state === loc.state;
            return (
              <Animated.View key={`${loc.city}-${loc.state}`} entering={FadeInDown.delay(60 + i * 50)}>
                <Pressable
                  onPress={() => handleSelect(loc)}
                  style={({ pressed }) => [styles.row, selected && styles.rowSelected, pressed && styles.rowPressed]}
                >
                  <View style={[styles.rowIcon, selected && styles.rowIconActive]}>
                    <Feather
                      name="map-pin"
                      size={18}
                      color={selected ? theme.colors.textInverse : theme.colors.textSecondary}
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.rowTitle}>{loc.city}</Text>
                    <Text style={styles.rowSub}>{formatLocation(loc)}</Text>
                  </View>
                  {selected && <Feather name="check" size={20} color={theme.colors.tint} />}
                </Pressable>
              </Animated.View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  title: { ...theme.typography.h3, color: theme.colors.text },
  searchWrap: { paddingHorizontal: theme.spacing(2.5), marginBottom: theme.spacing(1.5) },
  listContent: { paddingHorizontal: theme.spacing(2.5), paddingBottom: theme.spacing(6) },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1.5),
  },
  sectionLabel: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(2),
    backgroundColor: theme.colors.card,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: theme.radii.lg,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(1.25),
  },
  rowSelected: {
    borderColor: theme.colors.tint,
    backgroundColor: theme.colors.surface,
  },
  rowPressed: { opacity: 0.7 },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rowIconActive: { backgroundColor: theme.colors.tint },
  rowTitle: { ...theme.typography.body, color: theme.colors.text, fontWeight: '600' },
  rowSub: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },
  emptyWrap: { alignItems: 'center', padding: theme.spacing(4) },
  emptyTitle: { ...theme.typography.h3, color: theme.colors.textSecondary },
  emptySub: { ...theme.typography.body, color: theme.colors.textMuted, marginTop: theme.spacing(0.5), textAlign: 'center' },
  useCustomBtn: {
    marginTop: theme.spacing(2),
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.25),
    backgroundColor: theme.colors.tint,
    borderRadius: theme.radii.round,
  },
  useCustomBtnText: { ...theme.typography.label, color: theme.colors.textInverse, fontWeight: '700' },
}));
