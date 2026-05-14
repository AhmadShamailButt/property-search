import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  const { theme, rt } = useUnistyles();
  const themeName = rt.themeName;

  return (
    <Tabs
      key={themeName}
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 1,
          borderTopColor: theme.colors.border,
          elevation: 20,
          shadowColor: theme.colors.shadowStrong,
          shadowOffset: { width: 0, height: -8 },
          shadowOpacity: 0.12,
          shadowRadius: 16,
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
        tabBarShowLabel: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: 'Favorites',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

type FeatherName = React.ComponentProps<typeof Feather>['name'];

function TabIcon({ name, color, focused }: { name: FeatherName; color: string; focused: boolean }) {
  const { theme } = useUnistyles();

  return (
    <View style={[
      styles.iconContainer,
      focused && { backgroundColor: theme.colors.tabActiveBg },
    ]}>
      <Feather name={name} size={22} color={color} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  iconContainer: {
    width: 40,
    height: 32,
    borderRadius: theme.radii.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
