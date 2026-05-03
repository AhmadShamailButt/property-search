import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent, Pressable } from 'react-native';
import { Image } from 'expo-image';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';

export type CarouselItem = {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
};

interface BannerCarouselProps {
  items: CarouselItem[];
  horizontalPadding?: number;
  height?: number;
  autoplayMs?: number;
}

export const BannerCarousel = ({
  items,
  horizontalPadding = 20,
  height = 180,
  autoplayMs = 4500,
}: BannerCarouselProps) => {
  const { theme } = useUnistyles();
  const { width: winWidth } = useWindowDimensions();
  const slideWidth = Math.min(winWidth, 700) - horizontalPadding * 2;
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const userInteracting = useRef(false);
  const progress = useSharedValue(0);

  const goTo = (i: number, animated = true) => {
    scrollRef.current?.scrollTo({ x: i * slideWidth, animated });
  };

  useEffect(() => {
    if (items.length <= 1 || autoplayMs <= 0) return;
    const id = setInterval(() => {
      if (userInteracting.current) return;
      const next = (index + 1) % items.length;
      goTo(next);
    }, autoplayMs);
    return () => clearInterval(id);
  }, [index, items.length, autoplayMs, slideWidth]);

  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const x = e.nativeEvent.contentOffset.x;
    progress.value = x / slideWidth;
    const i = Math.round(x / slideWidth);
    if (i !== index) setIndex(i);
  };

  if (!items.length) return null;

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        decelerationRate="fast"
        onTouchStart={() => { userInteracting.current = true; }}
        onTouchEnd={() => { userInteracting.current = false; }}
        onScrollBeginDrag={() => { userInteracting.current = true; }}
        onScrollEndDrag={() => { setTimeout(() => { userInteracting.current = false; }, 800); }}
      >
        {items.map((item, i) => (
          <BannerSlide key={item.id} item={item} width={slideWidth} height={height} index={i} progress={progress} />
        ))}
      </ScrollView>

      <View style={[styles.dotsRow, { height: 18 }]}>
        {items.map((item, i) => (
          <Pressable key={item.id} onPress={() => goTo(i)} hitSlop={6}>
            <Dot index={i} progress={progress} />
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const BannerSlide = ({
  item,
  width,
  height,
  index,
  progress,
}: {
  item: CarouselItem;
  width: number;
  height: number;
  index: number;
  progress: Animated.SharedValue<number>;
}) => {
  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [1.18, 1.02, 1.18],
      Extrapolation.CLAMP,
    );
    return { transform: [{ scale }] };
  });

  const contentStyle = useAnimatedStyle(() => {
    const translateY = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [40, 0, 40],
      Extrapolation.CLAMP,
    );
    const opacity = interpolate(
      progress.value,
      [index - 0.7, index, index + 0.7],
      [0, 1, 0],
      Extrapolation.CLAMP,
    );
    return { transform: [{ translateY }], opacity };
  });

  return (
    <View style={[styles.slide, { width, height }]}>
      <Animated.View style={[StyleSheet.absoluteFillObject, imageStyle]}>
        <Image source={{ uri: item.image_url }} style={StyleSheet.absoluteFillObject} contentFit="cover" transition={250} />
      </Animated.View>
      <View style={styles.slideOverlay} pointerEvents="none" />
      <Animated.View style={[styles.slideContent, contentStyle]}>
        <Text style={styles.slideTitle} numberOfLines={2}>{item.title}</Text>
        {item.subtitle ? (
          <Text style={styles.slideSub} numberOfLines={2}>{item.subtitle}</Text>
        ) : null}
      </Animated.View>
    </View>
  );
};

const Dot = ({ index, progress }: { index: number; progress: Animated.SharedValue<number> }) => {
  const style = useAnimatedStyle(() => {
    const w = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [6, 22, 6],
      Extrapolation.CLAMP,
    );
    const op = interpolate(
      progress.value,
      [index - 1, index, index + 1],
      [0.35, 1, 0.35],
      Extrapolation.CLAMP,
    );
    return { width: w, opacity: op };
  });
  return <Animated.View style={[styles.dot, style]} />;
};

const styles = StyleSheet.create((theme) => ({
  slide: {
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
    marginRight: 0,
    backgroundColor: theme.colors.surface,
  },
  slideOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  slideContent: {
    position: 'absolute',
    left: theme.spacing(2.5),
    right: theme.spacing(2.5),
    bottom: theme.spacing(2.5),
  },
  slideTitle: {
    ...theme.typography.h2,
    color: '#ffffff',
    marginBottom: theme.spacing(0.5),
  },
  slideSub: {
    ...theme.typography.body,
    color: 'rgba(255,255,255,0.85)',
  },
  dotsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: theme.spacing(1.5),
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: theme.colors.tint,
  },
}));
