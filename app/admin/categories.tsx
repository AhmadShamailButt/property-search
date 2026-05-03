import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, ActivityIndicator, Alert, Platform, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

import { supabase } from '@/utils/supabase';
import { Banner } from '@/components/ui/Banner';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Section } from '@/components/ui/Section';

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  is_active: boolean;
  sort_order: number;
};

const slugify = (s: string): string =>
  s
    .toLowerCase()
    .trim()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

export default function AdminCategoriesScreen() {
  const { theme } = useUnistyles();
  const [categories, setCategories] = useState<CategoryRow[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const [newName, setNewName] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('categories')
      .select('id, name, slug, is_active, sort_order')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });
    if (err) {
      setError(err.message);
      setCategories([]);
    } else {
      setCategories((data ?? []) as CategoryRow[]);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchCategories();
    setRefreshing(false);
  }, [fetchCategories]);

  const startEdit = (cat: CategoryRow) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setError(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
  };

  const saveEdit = async (cat: CategoryRow) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty.');
      return;
    }
    if (trimmed === cat.name) {
      cancelEdit();
      return;
    }
    setSavingId(cat.id);
    const slug = slugify(trimmed);
    const { error: err } = await supabase
      .from('categories')
      .update({ name: trimmed, slug })
      .eq('id', cat.id);
    setSavingId(null);
    if (err) {
      setError(err.message);
      return;
    }
    setCategories((prev) =>
      prev?.map((c) => (c.id === cat.id ? { ...c, name: trimmed, slug } : c)) ?? null,
    );
    cancelEdit();
  };

  const toggleActive = async (cat: CategoryRow) => {
    const next = !cat.is_active;
    setCategories((prev) =>
      prev?.map((c) => (c.id === cat.id ? { ...c, is_active: next } : c)) ?? null,
    );
    const { error: err } = await supabase
      .from('categories')
      .update({ is_active: next })
      .eq('id', cat.id);
    if (err) {
      // Roll back
      setCategories((prev) =>
        prev?.map((c) => (c.id === cat.id ? { ...c, is_active: !next } : c)) ?? null,
      );
      setError(err.message);
    }
  };

  const moveOrder = async (cat: CategoryRow, direction: 'up' | 'down') => {
    if (!categories) return;
    const idx = categories.findIndex((c) => c.id === cat.id);
    const swapIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;

    const a = categories[idx];
    const b = categories[swapIdx];
    const next = [...categories];
    next[idx] = { ...a, sort_order: b.sort_order };
    next[swapIdx] = { ...b, sort_order: a.sort_order };
    next.sort((x, y) => x.sort_order - y.sort_order);
    setCategories(next);

    // Persist both
    const errors = await Promise.all([
      supabase.from('categories').update({ sort_order: b.sort_order }).eq('id', a.id),
      supabase.from('categories').update({ sort_order: a.sort_order }).eq('id', b.id),
    ]);
    if (errors.some((r) => r.error)) {
      setError('Failed to reorder. Refresh to see actual order.');
      fetchCategories();
    }
  };

  const confirmDelete = (cat: CategoryRow) => {
    const proceed = async () => {
      // Safety: refuse if any properties use this category
      const { count, error: countErr } = await supabase
        .from('properties')
        .select('id', { count: 'exact', head: true })
        .eq('category_id', cat.id);
      if (countErr) {
        setError(countErr.message);
        return;
      }
      if ((count ?? 0) > 0) {
        setError(`Cannot delete "${cat.name}" — ${count} ${count === 1 ? 'property uses' : 'properties use'} it. Reassign them first.`);
        return;
      }
      const { error: delErr } = await supabase.from('categories').delete().eq('id', cat.id);
      if (delErr) {
        setError(delErr.message);
        return;
      }
      setCategories((prev) => prev?.filter((c) => c.id !== cat.id) ?? null);
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm(`Delete category "${cat.name}"?`)) {
        void proceed();
      }
      return;
    }
    Alert.alert(
      'Delete category',
      `Delete "${cat.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: proceed },
      ],
    );
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) {
      setError('Category name cannot be empty.');
      return;
    }
    setIsAdding(true);
    setError(null);
    const slug = slugify(trimmed);
    const nextOrder = (categories?.length ?? 0) + 1;
    const { data, error: err } = await supabase
      .from('categories')
      .insert({ name: trimmed, slug, sort_order: nextOrder, is_active: true })
      .select('id, name, slug, is_active, sort_order')
      .single();
    setIsAdding(false);
    if (err) {
      setError(err.message);
      return;
    }
    if (data) {
      setCategories((prev) => [...(prev ?? []), data as CategoryRow]);
      setNewName('');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Categories</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />}
      >
        {error ? (
          <View style={styles.errorWrap}>
            <Banner tone="error">{error}</Banner>
          </View>
        ) : null}

        {isLoading && !categories ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator color={theme.colors.tint} />
          </View>
        ) : (
          <>
            <Section label="Categories" hint="Drag-style ordering — use ↑↓ to move">
              {(categories ?? []).length === 0 ? (
                <View style={styles.emptyRow}>
                  <Text style={styles.emptyText}>No categories yet. Add the first one below.</Text>
                </View>
              ) : null}

              {(categories ?? []).map((cat, i) => {
                const isEditing = editingId === cat.id;
                const isSaving = savingId === cat.id;
                const isFirst = i === 0;
                const isLast = i === (categories?.length ?? 0) - 1;

                return (
                  <View key={cat.id} style={styles.row}>
                    <View style={styles.rowOrder}>
                      <Text style={styles.orderText}>{cat.sort_order}</Text>
                    </View>

                    <View style={styles.rowMain}>
                      {isEditing ? (
                        <Input
                          value={editName}
                          onChangeText={setEditName}
                          autoCapitalize="words"
                          autoFocus
                        />
                      ) : (
                        <>
                          <Text style={[styles.rowName, !cat.is_active && styles.rowNameInactive]}>{cat.name}</Text>
                          <Text style={styles.rowSlug}>/{cat.slug}</Text>
                        </>
                      )}
                    </View>

                    <View style={styles.rowActions}>
                      {isEditing ? (
                        <>
                          <TouchableOpacity onPress={() => saveEdit(cat)} disabled={isSaving} hitSlop={8}>
                            {isSaving ? (
                              <ActivityIndicator size="small" color={theme.colors.tint} />
                            ) : (
                              <Feather name="check" size={20} color={theme.colors.success} />
                            )}
                          </TouchableOpacity>
                          <TouchableOpacity onPress={cancelEdit} disabled={isSaving} hitSlop={8}>
                            <Feather name="x" size={20} color={theme.colors.textMuted} />
                          </TouchableOpacity>
                        </>
                      ) : (
                        <>
                          <TouchableOpacity onPress={() => moveOrder(cat, 'up')} disabled={isFirst} hitSlop={8}>
                            <Feather name="chevron-up" size={20} color={isFirst ? theme.colors.border : theme.colors.text} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => moveOrder(cat, 'down')} disabled={isLast} hitSlop={8}>
                            <Feather name="chevron-down" size={20} color={isLast ? theme.colors.border : theme.colors.text} />
                          </TouchableOpacity>
                          <Switch
                            value={cat.is_active}
                            onValueChange={() => toggleActive(cat)}
                            trackColor={{ false: theme.colors.border, true: theme.colors.tint }}
                          />
                          <TouchableOpacity onPress={() => startEdit(cat)} hitSlop={8}>
                            <Feather name="edit-2" size={18} color={theme.colors.tint} />
                          </TouchableOpacity>
                          <TouchableOpacity onPress={() => confirmDelete(cat)} hitSlop={8}>
                            <Feather name="trash-2" size={18} color={theme.colors.error} />
                          </TouchableOpacity>
                        </>
                      )}
                    </View>
                  </View>
                );
              })}
            </Section>

            <Section label="Add new">
              <View style={styles.addRow}>
                <View style={{ flex: 1 }}>
                  <Input
                    value={newName}
                    onChangeText={setNewName}
                    placeholder="e.g. Townhouse"
                    autoCapitalize="words"
                    onSubmitEditing={handleAdd}
                  />
                </View>
                <Button
                  label="Add"
                  variant="primary"
                  size="md"
                  icon="plus"
                  onPress={handleAdd}
                  isLoading={isAdding}
                  disabled={!newName.trim() || isAdding}
                />
              </View>
            </Section>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },

  header: { paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(2), paddingBottom: theme.spacing(1.5) },
  title: { ...theme.typography.h2, color: theme.colors.text },

  scroll: { padding: theme.spacing(2.5), paddingBottom: theme.spacing(8), gap: theme.spacing(2) },

  errorWrap: { marginBottom: theme.spacing(2) },
  loadingWrap: { paddingVertical: theme.spacing(8), alignItems: 'center' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.5),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    padding: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  rowOrder: {
    width: 32,
    height: 32,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  orderText: { ...theme.typography.caption, color: theme.colors.textSecondary, fontWeight: '700' },
  rowMain: { flex: 1, gap: theme.spacing(0.25) },
  rowName: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  rowNameInactive: { color: theme.colors.textMuted, textDecorationLine: 'line-through' },
  rowSlug: { ...theme.typography.caption, color: theme.colors.textMuted },
  rowActions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1.5) },

  emptyRow: { padding: theme.spacing(2) },
  emptyText: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' },

  addRow: { flexDirection: 'row', gap: theme.spacing(1.5), alignItems: 'flex-end' },
}));
