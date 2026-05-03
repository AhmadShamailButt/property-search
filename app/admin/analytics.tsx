import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Banner } from '@/components/ui/Banner';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';
import {
  useFilterLogs,
  useFilterUsage,
  useTopLocations,
  useTopPriceBrackets,
  useDropOffRate,
  useFilterCombinationConversion,
  type CountedItem,
  type DateRange,
  type FilterUsageGroup,
  type ConversionRow,
} from '@/hooks/useAnalytics';

type Preset = '7d' | '30d' | '90d' | 'all' | 'custom';

const PRESET_OPTIONS: { value: Preset; label: string }[] = [
  { value: '7d',     label: 'Last 7 days' },
  { value: '30d',    label: 'Last 30 days' },
  { value: '90d',    label: 'Last 90 days' },
  { value: 'all',    label: 'All time' },
  { value: 'custom', label: 'Custom' },
];

const today = () => {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
};
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
};
const formatYMD = (d: Date) => d.toISOString().slice(0, 10);
const parseYMD = (s: string): Date | null => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const ts = Date.parse(s + 'T00:00:00.000Z');
  return Number.isFinite(ts) ? new Date(ts) : null;
};

const presetToRange = (preset: Preset): DateRange => {
  switch (preset) {
    case '7d':  return { from: daysAgo(7),  to: today() };
    case '30d': return { from: daysAgo(30), to: today() };
    case '90d': return { from: daysAgo(90), to: today() };
    case 'all': return { from: new Date('2000-01-01'), to: today() };
    case 'custom': return { from: daysAgo(30), to: today() };
  }
};

const formatPercent = (n: number) =>
  Number.isFinite(n) ? `${Math.round(n * 100)}%` : '—';

export default function AdminAnalyticsScreen() {
  const { theme } = useUnistyles();

  const [preset, setPreset] = useState<Preset>('30d');
  const [customFrom, setCustomFrom] = useState(formatYMD(daysAgo(30)));
  const [customTo, setCustomTo] = useState(formatYMD(today()));

  const { range, customError } = useMemo(() => {
    if (preset !== 'custom') {
      return { range: presetToRange(preset), customError: null };
    }
    const from = parseYMD(customFrom);
    const to = parseYMD(customTo);
    if (!from || !to) return { range: presetToRange('30d'), customError: 'Use YYYY-MM-DD format.' };
    if (from > to) return { range: presetToRange('30d'), customError: '"From" must be before "To".' };
    const toEnd = new Date(to);
    toEnd.setHours(23, 59, 59, 999);
    return { range: { from, to: toEnd }, customError: null };
  }, [preset, customFrom, customTo]);

  const { data: rows, isLoading, error, reachedCap } = useFilterLogs(range);
  const filterUsage = useFilterUsage(rows);
  const topLocations = useTopLocations(rows);
  const topPriceBrackets = useTopPriceBrackets(rows);
  const dropOff = useDropOffRate(rows);
  const conversionTable = useFilterCombinationConversion(rows);

  const rangeLabelText = useMemo(() => {
    if (preset === 'all') return 'All time';
    return `${formatYMD(range.from)}  →  ${formatYMD(range.to)}`;
  }, [preset, range]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="arrow-left" size={20} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerText}>
          <Text style={styles.title}>Analytics</Text>
          <Text style={styles.subtitle}>{rangeLabelText}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.delay(60)}>
          <Section label="Date range">
            <ChipGroup<Preset>
              options={PRESET_OPTIONS}
              value={preset}
              onChange={setPreset}
            />
            {preset === 'custom' ? (
              <View style={styles.customRow}>
                <View style={styles.customInputWrap}>
                  <Input
                    label="From"
                    placeholder="YYYY-MM-DD"
                    value={customFrom}
                    onChangeText={setCustomFrom}
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.customInputWrap}>
                  <Input
                    label="To"
                    placeholder="YYYY-MM-DD"
                    value={customTo}
                    onChangeText={setCustomTo}
                    autoCapitalize="none"
                  />
                </View>
              </View>
            ) : null}
            {customError ? (
              <View style={styles.errorBannerWrap}>
                <Banner tone="error">{customError}</Banner>
              </View>
            ) : null}
          </Section>
        </Animated.View>

        {error ? (
          <View style={styles.errorBannerWrap}>
            <Banner tone="error">Failed to load analytics: {error}</Banner>
          </View>
        ) : null}

        {reachedCap ? (
          <View style={styles.errorBannerWrap}>
            <Banner tone="warning">
              Showing the most recent 5,000 searches in the range. Narrow the date range for full coverage.
            </Banner>
          </View>
        ) : null}

        {isLoading && !rows ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.tint} />
          </View>
        ) : !rows || rows.length === 0 ? (
          <View style={styles.errorBannerWrap}>
            <Banner tone="info">
              No searches recorded in this range. Try widening the date range or check back after some user activity.
            </Banner>
          </View>
        ) : (
          <>
            <Animated.View entering={FadeInDown.delay(120)} style={styles.summaryGrid}>
              <SummaryCard label="Searches"   value={String(dropOff.searches)} />
              <SummaryCard label="Taps"       value={String(dropOff.tapped)} />
              <SummaryCard label="Drop-off"   value={formatPercent(dropOff.rate)} accent="error" />
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(180)}>
              <Section label="Most-used filters">
                <View style={styles.cardStack}>
                  {filterUsage.map((g) => (
                    <FilterUsageCard key={g.key} group={g} />
                  ))}
                </View>
              </Section>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(240)}>
              <Section label="Most-searched locations">
                <BarList
                  items={topLocations}
                  emptyText="No city filter has been applied yet."
                />
              </Section>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(300)}>
              <Section label="Most-searched price brackets">
                <BarList
                  items={topPriceBrackets}
                  emptyText="No price filter has been narrowed yet."
                />
              </Section>
            </Animated.View>

            <Animated.View entering={FadeInDown.delay(360)}>
              <Section label="Filter combination → property detail conversion">
                <ConversionTable rows={conversionTable} />
              </Section>
            </Animated.View>
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ----------------------------------------------------------------
// Sub-components
// ----------------------------------------------------------------

function SummaryCard({ label, value, accent }: { label: string; value: string; accent?: 'error' }) {
  return (
    <View style={styles.summaryCard}>
      <Text style={accent === 'error' ? styles.summaryValueAccent : styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function FilterUsageCard({ group }: { group: FilterUsageGroup }) {
  const top = group.counts.slice(0, 5);
  if (top.length === 0) {
    return (
      <View style={styles.usageCard}>
        <Text style={styles.usageTitle}>{group.title}</Text>
        <Text style={styles.emptyInline}>Not used in this range.</Text>
      </View>
    );
  }
  const max = top[0].count;
  return (
    <View style={styles.usageCard}>
      <Text style={styles.usageTitle}>{group.title}</Text>
      <View style={styles.barListInner}>
        {top.map((item) => (
          <BarRow key={item.label} label={item.label} count={item.count} maxCount={max} />
        ))}
      </View>
    </View>
  );
}

function BarList({ items, emptyText }: { items: CountedItem[]; emptyText: string }) {
  if (items.length === 0) {
    return (
      <View style={styles.usageCard}>
        <Text style={styles.emptyInline}>{emptyText}</Text>
      </View>
    );
  }
  const max = items[0].count;
  return (
    <View style={styles.usageCard}>
      <View style={styles.barListInner}>
        {items.slice(0, 8).map((item) => (
          <BarRow key={item.label} label={item.label} count={item.count} maxCount={max} />
        ))}
      </View>
    </View>
  );
}

function BarRow({ label, count, maxCount }: { label: string; count: number; maxCount: number }) {
  const widthPct = maxCount === 0 ? 0 : Math.max(4, Math.round((count / maxCount) * 100));
  return (
    <View style={styles.barRow}>
      <Text style={styles.barLabel} numberOfLines={1}>{label}</Text>
      <View style={styles.barTrack}>
        <View style={[styles.barFill, { width: `${widthPct}%` }]} />
      </View>
      <Text style={styles.barCount}>{count}</Text>
    </View>
  );
}

function ConversionTable({ rows }: { rows: ConversionRow[] }) {
  const { theme } = useUnistyles();
  if (rows.length === 0) {
    return (
      <View style={styles.usageCard}>
        <Text style={styles.emptyInline}>Not enough data to compute conversion combinations.</Text>
      </View>
    );
  }
  const conversionColor = (rate: number): string => {
    if (rate >= 0.75) return theme.colors.success;
    if (rate >= 0.5)  return theme.colors.warning;
    return theme.colors.error;
  };
  return (
    <View style={styles.usageCard}>
      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderCell, styles.tableComboCol]}>Combination</Text>
        <Text style={[styles.tableHeaderCell, styles.tableNumCol]}>Searches</Text>
        <Text style={[styles.tableHeaderCell, styles.tableNumCol]}>Conv.</Text>
      </View>
      {rows.map((row) => (
        <View key={row.signature} style={styles.tableRow}>
          <Text style={[styles.tableCell, styles.tableComboCol]} numberOfLines={2}>{row.humanLabel}</Text>
          <Text style={[styles.tableCell, styles.tableNumCol]}>{row.searches}</Text>
          <Text style={[styles.tableCellMetric, styles.tableNumCol, { color: conversionColor(row.rate) }]}>
            {formatPercent(row.rate)}
          </Text>
        </View>
      ))}
    </View>
  );
}

// ----------------------------------------------------------------
// Styles
// ----------------------------------------------------------------
const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
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
  headerText: { flex: 1 },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(0.25) },

  scroll: { paddingHorizontal: theme.spacing(2.5), paddingTop: theme.spacing(1) },

  customRow: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
  },
  customInputWrap: { flex: 1 },

  errorBannerWrap: { marginVertical: theme.spacing(1.5) },

  loadingWrap: { paddingVertical: theme.spacing(6), alignItems: 'center' },

  summaryGrid: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(2),
  },
  summaryCard: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(2),
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
  },
  summaryValue: { ...theme.typography.h2, color: theme.colors.tint, marginBottom: theme.spacing(0.5) },
  summaryValueAccent: { ...theme.typography.h2, color: theme.colors.error, marginBottom: theme.spacing(0.5) },
  summaryLabel: { ...theme.typography.caption, color: theme.colors.textSecondary },

  cardStack: { gap: theme.spacing(1.5) },
  usageCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(2),
  },
  usageTitle: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700', marginBottom: theme.spacing(1.25) },
  emptyInline: { ...theme.typography.caption, color: theme.colors.textMuted },

  barListInner: { gap: theme.spacing(1) },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },
  barLabel: { width: 120, ...theme.typography.caption, color: theme.colors.textSecondary },
  barTrack: { flex: 1, height: 14, backgroundColor: theme.colors.background, borderRadius: theme.radii.round, overflow: 'hidden' },
  barFill: { height: '100%', backgroundColor: theme.colors.tint },
  barCount: { width: 36, textAlign: 'right', ...theme.typography.caption, color: theme.colors.text, fontWeight: '600' },

  tableHeader: {
    flexDirection: 'row',
    gap: theme.spacing(1),
    paddingBottom: theme.spacing(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
    marginBottom: theme.spacing(1),
  },
  tableHeaderCell: { ...theme.typography.caption, color: theme.colors.textMuted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: {
    flexDirection: 'row',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.divider,
  },
  tableCell: { ...theme.typography.body, color: theme.colors.text },
  tableCellMetric: { ...theme.typography.body, fontWeight: '700' },
  tableComboCol: { flex: 3 },
  tableNumCol: { flex: 1, textAlign: 'right' },

  bottomSpacer: { height: theme.spacing(6) },
}));
