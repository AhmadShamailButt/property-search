import React from 'react';
import { ActivityIndicator, Pressable, type PressableProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';

type ButtonVariant = 'primary' | 'outline' | 'secondary' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

type ButtonProps = Omit<PressableProps, 'style'> & {
  title: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

const SIZE_MAP = { sm: 36, md: 48, lg: 52 } as const;

export function Button({
  title,
  variant = 'primary',
  size = 'lg',
  isLoading = false,
  disabled,
  icon,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || isLoading;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.base,
        { height: SIZE_MAP[size] },
        styles[variant],
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
      ]}
      disabled={isDisabled}
      {...props}>
      {isLoading ? (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'secondary'
            ? styles.outlineText.color
            : styles.primaryText.color}
          size="small"
        />
      ) : (
        <>
          {icon && (
            <MaterialIcons
              name={icon}
              size={size === 'sm' ? 16 : 20}
              color={
                variant === 'outline' || variant === 'secondary'
                  ? styles.outlineText.color
                  : styles.primaryText.color
              }
              style={styles.icon}
            />
          )}
          <ThemedText
            style={[
              styles.text,
              size === 'sm' && styles.textSm,
              variant === 'primary' || variant === 'danger'
                ? styles.primaryText
                : styles.outlineText,
            ]}>
            {title}
          </ThemedText>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create(theme => ({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingHorizontal: theme.spacing(3),
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.backgroundSecondary,
  },
  danger: {
    backgroundColor: theme.colors.error,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.6,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  textSm: {
    fontSize: 14,
  },
  primaryText: {
    color: theme.colors.textInverse,
  },
  outlineText: {
    color: theme.colors.primary,
  },
  icon: {
    marginRight: 8,
  },
}));
