import React from 'react';
import { Tabs } from 'expo-router';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { View } from 'react-native';

export default function TabLayout() {
  const { theme } = useUnistyles();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.colors.card,
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: theme.colors.shadowStrong,
          shadowOffset: { width: 0, height: -10 },
          shadowOpacity: 0.1,
          shadowRadius: 20,
          height: 80,
          paddingBottom: 20,
          paddingTop: 10,
          position: 'absolute',
          bottom: 20,
          left: 20,
          right: 20,
          borderRadius: theme.radii.round,
        },
        tabBarActiveTintColor: theme.colors.tint,
        tabBarInactiveTintColor: theme.colors.tabIconDefault,
        tabBarShowLabel: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="home" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="heart" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="message-circle" color={color} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="user" color={color} focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

function TabIcon({ name, color, focused }: { name: any; color: string; focused: boolean }) {
  const { theme } = useUnistyles();
  
  return (
    <View style={[
      styles.iconContainer, 
      focused && { backgroundColor: theme.colors.primaryLight }
    ]}>
      <Feather name={name} size={24} color={color} />
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  iconContainer: {
    padding: 12,
    borderRadius: theme.radii.round,
    justifyContent: 'center',
    alignItems: 'center',
  }
}));
