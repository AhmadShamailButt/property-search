import React from 'react';
import { Text, TouchableOpacity, TouchableOpacityProps, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

type Size = 'sm' | 'md';

interface ChipProps extends Omit<TouchableOpacityProps, 'children'> {
  label: string;
  selected?: boolean;
  size?: Size;
  onRemove?: () => void;
}

export const Chip = ({ label, selected = false, size = 'md', onRemove, style, ...props }: ChipProps) => {
  const { theme } = useUnistyles();
  styles.useVariants({ size, selected });

  return (
    <TouchableOpacity activeOpacity={0.8} style={[styles.chip, style]} {...props}>
      <Text style={styles.text}>{label}</Text>
      {onRemove && (
        <View style={styles.removeBtn}>
          <Feather
            name="x"
            size={size === 'sm' ? 12 : 14}
            color={selected ? theme.colors.textInverse : theme.colors.text}
            onPress={onRemove}
          />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create((theme) => ({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.radii.round,
    borderWidth: 1,
    variants: {
      size: {
        sm: { paddingHorizontal: theme.spacing(1.5), paddingVertical: theme.spacing(0.5) },
        md: { paddingHorizontal: theme.spacing(2), paddingVertical: theme.spacing(1) },
      },
      selected: {
        true: { backgroundColor: theme.colors.tint, borderColor: theme.colors.tint },
        false: { backgroundColor: theme.colors.surface, borderColor: theme.colors.border },
      },
    },
  },
  text: {
    variants: {
      size: {
        sm: { ...theme.typography.caption },
        md: { ...theme.typography.label },
      },
      selected: {
        true: { color: theme.colors.textInverse },
        false: { color: theme.colors.text },
      },
    },
  },
  removeBtn: {
    marginLeft: theme.spacing(0.5),
    justifyContent: 'center',
    alignItems: 'center',
  },
}));
