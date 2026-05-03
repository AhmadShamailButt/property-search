import React, { useEffect } from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export const PropertyCardSkeleton = () => {
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [pulse]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.image, pulseStyle]} />
      <View style={styles.content}>
        <Animated.View style={[styles.line, styles.linePrice, pulseStyle]} />
        <Animated.View style={[styles.line, styles.lineTitle, pulseStyle]} />
        <Animated.View style={[styles.line, styles.lineAddr, pulseStyle]} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing(3),
    overflow: 'hidden',
  },
  image: {
    height: 220,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  content: {
    padding: theme.spacing(2),
    gap: theme.spacing(1),
  },
  line: {
    height: 14,
    borderRadius: 7,
    backgroundColor: theme.colors.backgroundSecondary,
  },
  linePrice: {
    width: '40%',
    height: 22,
  },
  lineTitle: {
    width: '70%',
  },
  lineAddr: {
    width: '55%',
    height: 12,
  },
}));
