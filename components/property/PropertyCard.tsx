import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { Link } from 'expo-router';

export type Property = {
  id: string | number;
  title: string;
  address: string;
  price: string;
  type: string;
  featured?: boolean;
  image: string;
};

interface PropertyCardProps {
  property: Property;
  onFavorite?: () => void;
  isFavorite?: boolean;
}

export const PropertyCard = ({ property, onFavorite, isFavorite }: PropertyCardProps) => {
  const { theme } = useUnistyles();

  return (
    <Link href={`/property/${property.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: property.image }} style={styles.image} />
          
          <TouchableOpacity style={styles.favBtn} onPress={onFavorite}>
            <Feather name="heart" size={18} color={isFavorite ? theme.colors.accent : theme.colors.onImage} fill={isFavorite ? theme.colors.accent : 'transparent'} />
          </TouchableOpacity>
          
          {property.featured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredText}>Featured</Text>
            </View>
          )}
        </View>
        <View style={styles.content}>
          <Text style={styles.price}>{property.price}</Text>
          <Text style={styles.title} numberOfLines={1}>{property.title}</Text>
          <Text style={styles.address}>
            <Feather name="map-pin" size={12} color={theme.colors.textMuted} /> {property.address}
          </Text>
        </View>
      </TouchableOpacity>
    </Link>
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
  },
  imageContainer: {
    height: 200,
    borderTopLeftRadius: theme.radii.lg,
    borderTopRightRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  favBtn: {
    position: 'absolute',
    top: theme.spacing(1.5),
    right: theme.spacing(1.5),
    width: 36,
    height: 36,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.scrim,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featuredBadge: {
    position: 'absolute',
    top: theme.spacing(1.5),
    left: theme.spacing(1.5),
    backgroundColor: theme.colors.badge,
    paddingHorizontal: theme.spacing(1.5),
    paddingVertical: theme.spacing(0.5),
    borderRadius: theme.radii.round,
  },
  featuredText: {
    ...theme.typography.caption,
    color: theme.colors.textInverse,
    fontWeight: '700',
  },
  content: {
    padding: theme.spacing(2),
  },
  price: {
    ...theme.typography.h2,
    color: theme.colors.tint,
    marginBottom: theme.spacing(0.5),
  },
  title: {
    ...theme.typography.h3,
    color: theme.colors.text,
    marginBottom: theme.spacing(0.5),
  },
  address: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
  },
}));
