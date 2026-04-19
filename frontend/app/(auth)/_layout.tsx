import React from 'react';
import { Stack } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

export default function AuthLayout() {
  const { theme } = StyleSheet.useTheme();

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      contentStyle: { backgroundColor: theme.colors.background }
    }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
