import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Slider } from '@miblanchard/react-native-slider';

interface RangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (value: [number, number]) => void;
  formatLabel?: (value: number) => string;
}

export const RangeSlider = ({
  min,
  max,
  step = 1,
  value,
  onChange,
  formatLabel = (v) => String(v),
}: RangeSliderProps) => {
  const { theme } = useUnistyles();

  return (
    <View style={styles.container}>
      <View style={styles.labelRow}>
        <Text style={styles.value}>{formatLabel(value[0])}</Text>
        <Text style={styles.value}>{formatLabel(value[1])}</Text>
      </View>
      <Slider
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        minimumTrackTintColor={theme.colors.tint}
        maximumTrackTintColor={theme.colors.border}
        thumbTintColor={theme.colors.tint}
        onValueChange={(next) => {
          if (Array.isArray(next) && next.length === 2) {
            onChange([next[0], next[1]]);
          }
        }}
        trackStyle={styles.track}
        thumbStyle={styles.thumb}
      />
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: { gap: theme.spacing(1.5) },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between' },
  value: { ...theme.typography.caption, color: theme.colors.textSecondary },
  track: { height: 6, borderRadius: theme.radii.sm },
  thumb: { width: 24, height: 24, borderRadius: theme.radii.round },
}));
