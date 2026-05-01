import { Tabs } from 'expo-router';
import React from 'react';
import { UnistylesRuntime } from 'react-native-unistyles';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/colors';

export default function TabLayout() {
  const themeName = UnistylesRuntime.themeName ?? 'light';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[themeName].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
        }}
      />
    </Tabs>
  );
}
