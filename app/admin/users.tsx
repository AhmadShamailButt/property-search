import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

export default function AdminUsersScreen() {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Manage Users</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.userRow}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=owner1' }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>Sarah Jenkins</Text>
            <Text style={styles.email}>sarah@example.com</Text>
            <View style={styles.roleBadge}><Text style={styles.roleText}>Owner</Text></View>
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>Deactivate</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.userRow}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=searchuser' }} style={styles.avatar} />
          <View style={styles.info}>
            <Text style={styles.name}>John Doe</Text>
            <Text style={styles.email}>john@example.com</Text>
            <View style={[styles.roleBadge, { backgroundColor: theme.colors.surface }]}><Text style={[styles.roleText, { color: theme.colors.textSecondary }]}>Searcher</Text></View>
          </View>
          <TouchableOpacity style={styles.actionBtn}>
            <Text style={styles.actionText}>Deactivate</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing(3) },
  title: { ...theme.typography.h2, color: theme.colors.text },
  scroll: { padding: theme.spacing(2) },
  userRow: { flexDirection: 'row', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border, alignItems: 'center', marginBottom: theme.spacing(2) },
  avatar: { width: 50, height: 50, borderRadius: theme.radii.round, marginRight: theme.spacing(2) },
  info: { flex: 1, alignItems: 'flex-start' },
  name: { ...theme.typography.label, color: theme.colors.text, marginBottom: 2 },
  email: { ...theme.typography.caption, color: theme.colors.textSecondary, marginBottom: 6 },
  roleBadge: { backgroundColor: theme.colors.tint + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4 },
  roleText: { ...theme.typography.caption, color: theme.colors.tint, fontWeight: '700' },
  actionBtn: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1), borderRadius: theme.radii.round, borderWidth: 1, borderColor: theme.colors.error },
  actionText: { ...theme.typography.caption, color: theme.colors.error },
}));
