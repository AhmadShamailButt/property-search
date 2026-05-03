import '../unistyles';
import React, { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { AuthProvider, useAuth, isAdminRole } from '@/contexts/auth-context';

SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { session, profile, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const { rt } = useUnistyles();

  useEffect(() => {
    if (isLoading) return;
    SplashScreen.hideAsync();

    const group = segments[0];

    if (!session) {
      if (group !== '(auth)') router.replace('/(auth)/login');
      return;
    }
    if (!profile) return;

    const isAdmin = isAdminRole(profile.role);
    const home = isAdmin ? '/admin' : '/(tabs)';
    const wrongGroup =
      group === '(auth)' ||
      (isAdmin && group === '(tabs)') ||
      (!isAdmin && group === 'admin');

    if (wrongGroup) router.replace(home);
  }, [session, profile, isLoading, segments]);

  const isDark = rt.themeName === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="search" />
        <Stack.Screen name="property/[id]" />
        <Stack.Screen name="property/[id]/ai-chat" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootNavigator />
    </AuthProvider>
  );
}
