import React from 'react';
import { TouchableOpacity, Text, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: Variant;
  icon?: keyof typeof Feather.glyphMap;
  size?: Size;
  fullWidth?: boolean;
  isLoading?: boolean;
}

export const Button = ({
  label,
  variant = 'primary',
  icon,
  size = 'md',
  fullWidth,
  isLoading,
  disabled,
  style,
  ...props
}: ButtonProps) => {
  const { theme } = useUnistyles();
  const isDisabled = disabled || isLoading;
  const iconColor = variant === 'primary' ? theme.colors.textInverse : theme.colors.text;

  styles.useVariants({ variant, size });

  return (
    <TouchableOpacity
      style={[
        styles.button,
        fullWidth && { width: '100%' },
        isDisabled && { opacity: 0.5 },
        style,
      ]}
      disabled={isDisabled}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={iconColor} />
      ) : (
        <>
          {icon && (
            <Feather
              name={icon}
              size={size === 'sm' ? 16 : 20}
              color={iconColor}
              style={styles.icon}
            />
          )}
          <Text style={styles.text}>{label}</Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.round,
    variants: {
      size: {
        sm: { height: 36, paddingHorizontal: theme.spacing(2) },
        md: { height: 48, paddingHorizontal: theme.spacing(3) },
        lg: { height: 56, paddingHorizontal: theme.spacing(4) },
      },
      variant: {
        primary: { backgroundColor: theme.colors.tint, ...theme.shadows.soft },
        outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border },
        ghost: { backgroundColor: 'transparent' },
      },
    },
  },
  icon: { marginRight: theme.spacing(1) },
  text: {
    fontWeight: '600',
    variants: {
      size: {
        sm: { ...theme.typography.caption },
        md: { ...theme.typography.label },
        lg: { ...theme.typography.h3 },
      },
      variant: {
        primary: { color: theme.colors.textInverse },
        outline: { color: theme.colors.text },
        ghost: { color: theme.colors.text },
      },
    },
  },
}));
