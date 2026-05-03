import React from 'react';
import { View } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Chip } from './Chip';

export interface ChipOption<T> {
  value: T;
  label: string;
}

interface ChipGroupProps<T> {
  options: readonly ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  size?: 'sm' | 'md';
}

export function ChipGroup<T>({ options, value, onChange, size = 'md' }: ChipGroupProps<T>) {
  return (
    <View style={styles.row}>
      {options.map((opt, idx) => (
        <Chip
          key={`${String(opt.value)}-${idx}`}
          label={opt.label}
          selected={opt.value === value}
          size={size}
          onPress={() => onChange(opt.value)}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create((theme) => ({
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: theme.spacing(1),
  },
}));
