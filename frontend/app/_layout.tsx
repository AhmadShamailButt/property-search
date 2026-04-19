import '../unistyles'; // CRITICAL: This is required to initialize the theme configuration!
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { UnistylesRuntime } from 'react-native-unistyles';
import React from 'react';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const isDark = UnistylesRuntime.themeName === 'dark';

  return (
    <ThemeProvider value={isDark ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="search" />
        <Stack.Screen name="property" />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
