import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { ChipGroup } from '@/components/ui/ChipGroup';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { ROLE_LABEL, type UserRole } from '@/contexts/auth-context';

type AdminUserRow = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: UserRole;
  is_active: boolean;
  phone: string | null;
  location: string | null;
  member_since: string;
};

type RoleFilter = 'all' | UserRole;

const ROLE_OPTIONS: { value: RoleFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'searcher', label: 'Searchers' },
  { value: 'owner', label: 'Owners' },
  { value: 'admin', label: 'Admins' },
];

export default function AdminUsersScreen() {
  const { theme } = useUnistyles();
  const router = useRouter();

  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [query, setQuery] = useState('');
  const [pendingId, setPendingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const { data, error: err } = await supabase
      .from('profiles')
      .select('id, full_name, avatar_url, role, is_active, phone, location, member_since')
      .order('member_since', { ascending: false });
    if (err) setError(err.message);
    else setUsers((data as AdminUserRow[]) ?? []);
  }, []);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      await load();
      setIsLoading(false);
    })();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  }, [load]);

  const toggleActive = useCallback(
    async (user: AdminUserRow) => {
      setPendingId(user.id);
      const next = !user.is_active;
      const { error: err } = await supabase
        .from('profiles')
        .update({ is_active: next })
        .eq('id', user.id);
      setPendingId(null);
      if (err) {
        setError(err.message);
        return;
      }
      setUsers((prev) => prev.map((u) => (u.id === user.id ? { ...u, is_active: next } : u)));
    },
    []
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return users.filter((u) => {
      if (roleFilter !== 'all' && u.role !== roleFilter) return false;
      if (q && !u.full_name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [users, roleFilter, query]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Users</Text>
        <Text style={styles.subtitle}>{filtered.length} of {users.length} accounts</Text>
      </View>

      <View style={styles.controls}>
        <Input
          icon="search"
          placeholder="Search by name…"
          value={query}
          onChangeText={setQuery}
        />
        <ChipGroup<RoleFilter>
          options={ROLE_OPTIONS}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={theme.colors.tint} />}
      >
        {isLoading ? (
          <ActivityIndicator color={theme.colors.tint} style={{ marginTop: theme.spacing(4) }} />
        ) : error ? (
          <Text style={styles.empty}>{error}</Text>
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>No users match.</Text>
        ) : (
          filtered.map((u) => (
            <UserCard
              key={u.id}
              user={u}
              isPending={pendingId === u.id}
              onPress={() => router.push(`/admin/users/${u.id}`)}
              onToggle={() => toggleActive(u)}
            />
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

interface UserCardProps {
  user: AdminUserRow;
  isPending: boolean;
  onPress: () => void;
  onToggle: () => void;
}

const UserCard = ({ user, isPending, onPress, onToggle }: UserCardProps) => {
  const { theme } = useUnistyles();

  return (
    <TouchableOpacity style={styles.userRow} activeOpacity={0.85} onPress={onPress}>
      {user.avatar_url ? (
        <Image source={user.avatar_url} style={styles.avatar} />
      ) : (
        <View style={[styles.avatar, styles.avatarFallback]}>
          <Feather name="user" size={20} color={theme.colors.icon} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.nameRow}>
          <Text style={styles.name} numberOfLines={1}>{user.full_name}</Text>
          {!user.is_active && (
            <View style={styles.inactivePill}>
              <Text style={styles.inactivePillText}>Inactive</Text>
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={[styles.roleBadge, user.role === 'admin' && styles.roleBadgeAdmin]}>
            <Text style={[styles.roleText, user.role === 'admin' && styles.roleTextAdmin]}>
              {ROLE_LABEL[user.role]}
            </Text>
          </View>
          {user.location && <Text style={styles.metaText}>· {user.location}</Text>}
        </View>
      </View>
      <Button
        label={user.is_active ? 'Deactivate' : 'Activate'}
        variant={user.is_active ? 'outline' : 'primary'}
        size="sm"
        isLoading={isPending}
        onPress={onToggle}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { paddingHorizontal: theme.spacing(3), paddingTop: theme.spacing(3), paddingBottom: theme.spacing(1) },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: theme.spacing(0.5) },
  controls: { paddingHorizontal: theme.spacing(2), paddingBottom: theme.spacing(2), gap: theme.spacing(1.5) },
  scroll: { padding: theme.spacing(2), gap: theme.spacing(1.5) },
  empty: { ...theme.typography.body, color: theme.colors.textSecondary, textAlign: 'center', marginTop: theme.spacing(4) },

  userRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(2), backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 48, height: 48, borderRadius: theme.radii.round },
  avatarFallback: { backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: theme.colors.border },
  info: { flex: 1, gap: theme.spacing(0.5) },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(1) },
  name: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700', flexShrink: 1 },
  inactivePill: { paddingHorizontal: theme.spacing(1), paddingVertical: 2, borderRadius: theme.radii.sm, backgroundColor: theme.colors.errorBg },
  inactivePillText: { ...theme.typography.caption, color: theme.colors.error, fontWeight: '700' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing(0.5), flexWrap: 'wrap' },
  roleBadge: { paddingHorizontal: theme.spacing(1), paddingVertical: 2, borderRadius: theme.radii.sm, backgroundColor: theme.colors.infoBg },
  roleBadgeAdmin: { backgroundColor: theme.colors.accent },
  roleText: { ...theme.typography.caption, color: theme.colors.info, fontWeight: '700' },
  roleTextAdmin: { color: theme.colors.textInverse },
  metaText: { ...theme.typography.caption, color: theme.colors.textSecondary },
}));
