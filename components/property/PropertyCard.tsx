import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, Image } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather, Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { useSearchSession } from '@/contexts/search-session-context';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withSequence,
  withRepeat,
  withTiming,
  Easing,
} from 'react-native-reanimated';

export type Property = {
  id: string | number;
  title: string;
  address: string;
  price: string;
  type: string;
  featured?: boolean;
  image: string;
  city?: string;
  bedrooms?: number;
  bathrooms?: number;
};

interface PropertyCardProps {
  property: Property;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

const FALLBACK_IMAGE =
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80';

export const PropertyCard = ({ property, onFavorite, isFavorite }: PropertyCardProps) => {
  const { theme } = useUnistyles();
  const { attributeTap } = useSearchSession();
  const heartScale = useSharedValue(1);
  const cardScale = useSharedValue(1);
  const shine = useSharedValue(0);
  const [imgUri, setImgUri] = useState(property.image || FALLBACK_IMAGE);

  useEffect(() => {
    setImgUri(property.image || FALLBACK_IMAGE);
  }, [property.image]);

  useEffect(() => {
    if (property.featured) {
      shine.value = withRepeat(
        withTiming(1, { duration: 2200, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    }
  }, [property.featured, shine]);

  const heartStyle = useAnimatedStyle(() => ({ transform: [{ scale: heartScale.value }] }));
  const cardStyle = useAnimatedStyle(() => ({ transform: [{ scale: cardScale.value }] }));
  const shineStyle = useAnimatedStyle(() => ({ opacity: 0.35 + shine.value * 0.5 }));

  const handleFavorite = () => {
    heartScale.value = withSequence(
      withSpring(1.35, { damping: 6, stiffness: 240 }),
      withSpring(1, { damping: 9, stiffness: 220 }),
    );
    onFavorite?.();
  };

  const handleOpen = () => {
    // Fire-and-forget: attribute the tap to the most recent search log
    // (no-op if no recent log). Don't await — navigation should feel instant.
    attributeTap(String(property.id));
    router.push({ pathname: '/property/[id]', params: { id: String(property.id) } });
  };

  return (
    <Pressable
      onPress={handleOpen}
      onPressIn={() => { cardScale.value = withSpring(0.985, { damping: 16, stiffness: 220 }); }}
      onPressOut={() => { cardScale.value = withSpring(1, { damping: 14, stiffness: 220 }); }}
    >
        <Animated.View style={[styles.card, cardStyle]}>
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imgUri }}
              style={styles.image}
              resizeMode="cover"
              onError={() => { if (imgUri !== FALLBACK_IMAGE) setImgUri(FALLBACK_IMAGE); }}
            />
            <View style={styles.imageOverlay} pointerEvents="none" />

            <TouchableOpacity style={styles.favBtn} onPress={handleFavorite} hitSlop={10}>
              <Animated.View style={heartStyle}>
                <Ionicons
                  name={isFavorite ? 'heart' : 'heart-outline'}
                  size={18}
                  color={isFavorite ? theme.colors.accent : theme.colors.onImage}
                />
              </Animated.View>
            </TouchableOpacity>

            {property.featured && (
              <View style={styles.featuredBadge}>
                <Animated.View style={[styles.featuredShine, shineStyle]} pointerEvents="none" />
                <Feather name="star" size={11} color={theme.colors.textInverse} />
                <Text style={styles.featuredText}>Featured</Text>
              </View>
            )}

            <View style={styles.typePill}>
              <Text style={styles.typePillText}>{property.type}</Text>
            </View>
          </View>

          <View style={styles.content}>
            <View style={styles.priceRow}>
              <Text style={styles.price}>{property.price}</Text>
              {(property.bedrooms != null || property.bathrooms != null) && (
                <View style={styles.metaRow}>
                  {property.bedrooms != null && (
                    <View style={styles.metaItem}>
                      <Feather name="moon" size={12} color={theme.colors.textMuted} />
                      <Text style={styles.metaText}>{property.bedrooms}</Text>
                    </View>
                  )}
                  {property.bathrooms != null && (
                    <View style={styles.metaItem}>
                      <Feather name="droplet" size={12} color={theme.colors.textMuted} />
                      <Text style={styles.metaText}>{property.bathrooms}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
            <View style={styles.addressRow}>
              <Feather name="map-pin" size={12} color={theme.colors.textMuted} />
              <Text style={styles.address} numberOfLines={1}>{property.address}</Text>
            </View>
          </View>
        </Animated.View>
    </Pressable>
  );
};

const styles = StyleSheet.create((theme) => ({
  card: {
    backgroundColor: theme.colors.card,
    borderRadius: theme.radii.lg,
    ...theme.shadows.soft,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginBottom: theme.spacing(3),
    overflow: 'hidden',
  },
  imageContainer: {
    height: 220,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  imageOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '55%',
    backgroundColor: theme.colors.scrim,
  },
  favBtn: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    width: 36,
    height: 36,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.scrimStrong,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.onImageBorder,
  },
  featuredBadge: {
    position: 'absolute',
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    backgroundColor: theme.colors.accent,
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radii.round,
    overflow: 'hidden',
  },
  featuredShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: theme.colors.onImageShine,
  },
  featuredText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  typePill: {
    position: 'absolute',
    bottom: theme.spacing(1.5),
    left: theme.spacing(1.5),
    backgroundColor: theme.colors.chipOnImageBg,
    paddingHorizontal: theme.spacing(1.25),
    paddingVertical: theme.spacing(0.4),
    borderRadius: theme.radii.round,
  },
  typePillText: {
    ...theme.typography.caption,
    color: theme.colors.chipOnImageText,
    fontWeight: '700',
  },
  content: {
    padding: theme.spacing(2),
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing(0.5),
  },
  price: {
    ...theme.typography.h2,
    color: theme.colors.tint,
  },
  metaRow: {
    flexDirection: 'row',
    gap: theme.spacing(1.5),
    alignItems: 'center',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing(0.5),
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  address: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    flex: 1,
  },
}));
