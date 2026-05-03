import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

export default function AdminLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
        },
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
      }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Dashboard', tabBarIcon: ({ color }) => <Feather name="bar-chart-2" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="listings"
        options={{ title: 'Listings', tabBarIcon: ({ color }) => <Feather name="home" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="users"
        options={{ title: 'Users', tabBarIcon: ({ color }) => <Feather name="users" size={24} color={color} /> }}
      />
      <Tabs.Screen
        name="banners"
        options={{ title: 'Banners', tabBarIcon: ({ color }) => <Feather name="image" size={24} color={color} /> }}
      />
      <Tabs.Screen name="analytics" options={{ href: null }} />
    </Tabs>
  );
}
