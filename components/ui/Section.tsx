import React from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

interface SectionProps {
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const Section = ({ label, hint, children }: SectionProps) => (
  <View style={styles.container}>
    <View style={styles.headerRow}>
      <Text style={styles.label}>{label}</Text>
      {hint && <Text style={styles.hint}>{hint}</Text>}
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create((theme) => ({
  container: { gap: theme.spacing(1.5) },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  label: { ...theme.typography.label, color: theme.colors.text },
  hint: { ...theme.typography.caption, color: theme.colors.textSecondary },
}));
