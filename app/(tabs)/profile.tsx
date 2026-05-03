import React from 'react';
import { View, Text, Switch, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, UnistylesRuntime , useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

import { useAuth } from '@/contexts/auth-context';

export default function ProfileScreen() {
  const { theme } = useUnistyles();
  const { user, confirmSignOut } = useAuth();

  const isDark = UnistylesRuntime.themeName === 'dark';

  const toggleTheme = () => {
    UnistylesRuntime.setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.profileSection}>
        <View style={styles.avatarContainer}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=a042581f4e29026704d' }} style={styles.avatar} />
          <TouchableOpacity style={styles.editBadge}>
            <Feather name="edit-2" size={12} color={theme.colors.textInverse} />
          </TouchableOpacity>
        </View>
        <Text style={styles.name}>{user?.user_metadata?.full_name ?? 'Welcome'}</Text>
        <Text style={styles.email}>{user?.email ?? ''}</Text>
      </View>

      <View style={styles.menuList}>
        <View style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Feather name="moon" size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.menuText}>Dark Theme</Text>
          <Switch value={isDark} onValueChange={toggleTheme} trackColor={{ false: theme.colors.border, true: theme.colors.tint }} />
        </View>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuIconContainer}>
            <Feather name="user" size={20} color={theme.colors.text} />
          </View>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Feather name="chevron-right" size={20} color={theme.colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={confirmSignOut}>
          <View style={styles.menuIconContainer}>
            <Feather name="log-out" size={20} color={theme.colors.error} />
          </View>
          <Text style={[styles.menuText, styles.menuTextDanger]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing(3), paddingBottom: theme.spacing(1) },
  title: { ...theme.typography.h1, color: theme.colors.text },
  profileSection: { alignItems: 'center', paddingVertical: theme.spacing(4) },
  avatarContainer: { position: 'relative', marginBottom: theme.spacing(2) },
  avatar: { width: 100, height: 100, borderRadius: theme.radii.round },
  editBadge: { position: 'absolute', bottom: 0, right: 0, backgroundColor: theme.colors.tint, width: 28, height: 28, borderRadius: theme.radii.round, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: theme.colors.background },
  name: { ...theme.typography.h2, color: theme.colors.text },
  email: { ...theme.typography.body, color: theme.colors.textSecondary },
  menuList: { paddingHorizontal: theme.spacing(3), gap: theme.spacing(2) },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, padding: theme.spacing(2), borderRadius: theme.radii.lg, borderWidth: 1, borderColor: theme.colors.border },
  menuIconContainer: { width: 40, height: 40, borderRadius: theme.radii.round, backgroundColor: theme.colors.background, justifyContent: 'center', alignItems: 'center', marginRight: theme.spacing(2) },
  menuText: { flex: 1, ...theme.typography.body, color: theme.colors.text, fontWeight: '500' },
  menuTextDanger: { color: theme.colors.error },
}));
