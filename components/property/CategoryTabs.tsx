import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, TouchableOpacity, Text, View, ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';

interface CategoryTabsProps {
  categories: string[];
  activeCategory: string;
  onSelect: (category: string) => void;
  style?: ViewStyle;
}

type TabLayout = { x: number; width: number };

export const CategoryTabs = ({ categories, activeCategory, onSelect, style }: CategoryTabsProps) => {
  const layouts = useRef<Record<string, TabLayout>>({});
  const [ready, setReady] = useState(false);

  const indicatorX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  useEffect(() => {
    const layout = layouts.current[activeCategory];
    if (layout) {
      indicatorX.value = withSpring(layout.x, { damping: 18, stiffness: 200 });
      indicatorWidth.value = withTiming(layout.width, {
        duration: 220,
        easing: Easing.out(Easing.cubic),
      });
    }
  }, [activeCategory, indicatorX, indicatorWidth, ready]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    width: indicatorWidth.value,
  }));

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={[styles.container, style]}
    >
      <View style={styles.track}>
        <Animated.View style={[styles.indicator, indicatorStyle]} pointerEvents="none" />
        {categories.map((cat) => {
          const isActive = activeCategory === cat;
          return (
            <TouchableOpacity
              key={cat}
              activeOpacity={0.7}
              style={styles.tab}
              onPress={() => onSelect(cat)}
              onLayout={(e) => {
                const { x, width } = e.nativeEvent.layout;
                layouts.current[cat] = { x, width };
                if (cat === activeCategory) {
                  indicatorX.value = x;
                  indicatorWidth.value = width;
                  if (!ready) setReady(true);
                }
              }}
            >
              <Text style={[styles.text, isActive && styles.textActive]}>{cat}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    flexDirection: 'row',
  },
  track: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    padding: theme.spacing(0.5),
    borderRadius: theme.radii.round,
    borderWidth: 1,
    borderColor: theme.colors.border,
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: theme.spacing(0.5),
    bottom: theme.spacing(0.5),
    backgroundColor: theme.colors.tint,
    borderRadius: theme.radii.round,
  },
  tab: {
    paddingHorizontal: theme.spacing(2.5),
    paddingVertical: theme.spacing(1.2),
    borderRadius: theme.radii.round,
    minWidth: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    ...theme.typography.label,
    color: theme.colors.textSecondary,
  },
  textActive: {
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
}));
