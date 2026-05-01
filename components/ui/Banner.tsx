import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export type BannerTone = 'info' | 'success' | 'error' | 'warning';

interface BannerProps {
  tone?: BannerTone;
  children: React.ReactNode;
}

export const Banner = ({ tone = 'info', children }: BannerProps) => {
  styles.useVariants({ tone });
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{children}</Text>
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: {
    borderRadius: theme.radii.md,
    padding: theme.spacing(2),
    variants: {
      tone: {
        info: { backgroundColor: theme.colors.infoBg },
        success: { backgroundColor: theme.colors.successBg },
        error: { backgroundColor: theme.colors.errorBg },
        warning: { backgroundColor: theme.colors.warningBg },
      },
    },
  },
  text: {
    ...theme.typography.body,
    variants: {
      tone: {
        info: { color: theme.colors.info },
        success: { color: theme.colors.success },
        error: { color: theme.colors.error },
        warning: { color: theme.colors.warning },
      },
    },
  },
}));
