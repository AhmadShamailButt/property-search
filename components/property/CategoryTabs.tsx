import React from 'react';
import { ScrollView, TouchableOpacity, Text, ViewStyle } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  style?: ViewStyle;
}

export const CategoryTabs = ({ categories, activeCategory, onSelect, style }: CategoryTabsProps) => {
  const { theme } = useUnistyles();

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false} 
      contentContainerStyle={[styles.container, style]}
    >
      {categories.map((cat) => {
        const isActive = activeCategory === cat;
        return (
          <TouchableOpacity 
            key={cat} 
            style={[styles.tab, isActive && styles.tabActive]}
            onPress={() => onSelect(cat)}
          >
            <Text style={[styles.text, isActive && styles.textActive]}>
              {cat}
            </Text>
          </TouchableOpacity>
        )
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    gap: theme.spacing(1),
    flexDirection: 'row',
  },
  tab: {
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.2),
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  tabActive: {
    backgroundColor: theme.colors.tint,
    borderColor: theme.colors.tint,
  },
  text: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  textActive: {
    color: theme.colors.textInverse,
  },
}));
