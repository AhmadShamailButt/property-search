import React from 'react';
import { TouchableOpacity, Text, TouchableOpacityProps, ViewStyle, TextStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

interface ButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'outline' | 'ghost';
  icon?: keyof typeof Feather.glyphMap;
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

export const Button = ({ label, variant = 'primary', icon, size = 'md', fullWidth, style, ...props }: ButtonProps) => {
  const { theme } = StyleSheet.useTheme();

  return (
    <TouchableOpacity 
      style={[
        styles.button(variant, size), 
        fullWidth && { width: '100%' },
        style
      ]} 
      {...props}
    >
      {icon && <Feather name={icon} size={size === 'sm' ? 16 : 20} color={variant === 'primary' ? '#fff' : theme.colors.text} style={{ marginRight: 8 }} />}
      <Text style={styles.text(variant, size)}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  button: (variant: 'primary' | 'outline' | 'ghost', size: 'sm' | 'md' | 'lg'): ViewStyle => {
    let base: ViewStyle = { 
      flexDirection: 'row', 
      alignItems: 'center', 
      justifyContent: 'center', 
      borderRadius: theme.radii.round 
    };
    
    if (size === 'sm') { base.height = 36; base.paddingHorizontal = theme.spacing(2); }
    if (size === 'md') { base.height = 48; base.paddingHorizontal = theme.spacing(3); }
    if (size === 'lg') { base.height = 56; base.paddingHorizontal = theme.spacing(4); }

    if (variant === 'primary') {
      return { ...base, backgroundColor: theme.colors.tint, ...theme.shadows.soft };
    }
    if (variant === 'outline') {
      return { ...base, backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.colors.border };
    }
    return { ...base, backgroundColor: 'transparent' }; // ghost
  },
  text: (variant: 'primary' | 'outline' | 'ghost', size: 'sm' | 'md' | 'lg'): TextStyle => {
    let base: TextStyle = { fontWeight: '600' };
    
    if (size === 'sm') Object.assign(base, theme.typography.caption);
    if (size === 'md') Object.assign(base, theme.typography.label);
    if (size === 'lg') Object.assign(base, theme.typography.h3);

    if (variant === 'primary') return { ...base, color: '#ffffff' };
    return { ...base, color: theme.colors.text };
  }
}));
