import { type TextStyle, type ViewStyle } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

// Base reusable styles (only truly global ones)
export const sharedStyles = StyleSheet.create(theme => ({
  fill: { flex: 1 },
  row: { flexDirection: 'row' as const },
  center: { justifyContent: 'center' as const, alignItems: 'center' as const },
}));

// Dynamic style helpers — pass params to get specific styles
export const s = StyleSheet.create(theme => {
  const colors = theme.colors;
  const sp = theme.spacing;

  return {
    // Spacing
    gap: (v: number): ViewStyle => ({ gap: sp(v) }),
    p: (v: number): ViewStyle => ({ padding: sp(v) }),
    px: (v: number): ViewStyle => ({ paddingHorizontal: sp(v) }),
    py: (v: number): ViewStyle => ({ paddingVertical: sp(v) }),
    pt: (v: number): ViewStyle => ({ paddingTop: sp(v) }),
    pb: (v: number): ViewStyle => ({ paddingBottom: sp(v) }),
    m: (v: number): ViewStyle => ({ margin: sp(v) }),
    mx: (v: number): ViewStyle => ({ marginHorizontal: sp(v) }),
    my: (v: number): ViewStyle => ({ marginVertical: sp(v) }),
    mt: (v: number): ViewStyle => ({ marginTop: sp(v) }),
    mb: (v: number): ViewStyle => ({ marginBottom: sp(v) }),

    // Layout
    content: (align: 'center' | 'top' = 'center'): ViewStyle => ({
      flexGrow: 1,
      padding: sp(3),
      ...(align === 'center'
        ? { justifyContent: 'center' }
        : { paddingTop: sp(8) }),
    }),

    // Banner (error / success / info)
    banner: (type: 'error' | 'success' | 'info' = 'error'): ViewStyle => ({
      backgroundColor: colors[type] + '15',
      borderRadius: 12,
      padding: sp(2),
      marginBottom: sp(2),
    }),
    bannerText: (type: 'error' | 'success' | 'info' = 'error'): TextStyle => ({
      color: colors[type],
      fontSize: 14,
    }),

    // Text colors
    color: (c: keyof typeof colors): TextStyle => ({ color: colors[c] }),
    fontSize: (size: number): TextStyle => ({ fontSize: size }),

    // Common patterns
    icon: (c: keyof typeof colors = 'primary', size?: number): TextStyle => ({
      color: colors[c],
      ...(size ? { fontSize: size } : {}),
    }),
  };
});
