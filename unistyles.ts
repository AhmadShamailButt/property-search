import { Appearance } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { Colors } from './constants/colors';

const lightTheme = {
  colors: Colors.light,
  spacing: (v: number) => v * 8,
  radii: {
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    round: 9999,
  },
  typography: {
    h1: { fontSize: 32, fontWeight: '800' as const, letterSpacing: -1 },
    h2: { fontSize: 24, fontWeight: '700' as const, letterSpacing: -0.5 },
    h3: { fontSize: 20, fontWeight: '600' as const },
    body: { fontSize: 16, fontWeight: '400' as const, lineHeight: 24 },
    label: { fontSize: 14, fontWeight: '500' as const },
    caption: { fontSize: 12, fontWeight: '500' as const },
  },
  shadows: {
    soft: {
      shadowColor: Colors.light.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
    strong: {
      shadowColor: Colors.light.shadowStrong,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 16,
    },
  }
} as const;

const darkTheme = {
  colors: Colors.dark,
  spacing: (v: number) => v * 8,
  radii: lightTheme.radii,
  typography: lightTheme.typography,
  shadows: {
    soft: {
      shadowColor: Colors.dark.shadow,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 1,
      shadowRadius: 24,
      elevation: 8,
    },
    strong: {
      shadowColor: Colors.dark.shadowStrong,
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 1,
      shadowRadius: 32,
      elevation: 16,
    },
  }
} as const;

const breakpoints = {
  xs: 0,
  sm: 360,
  md: 500,
  lg: 800,
  xl: 1200,
} as const;

type AppThemes = { light: typeof lightTheme; dark: typeof darkTheme };
type AppBreakpoints = typeof breakpoints;

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints,
  settings: {
    initialTheme: Appearance.getColorScheme() === 'dark' ? 'dark' : 'light',
  },
});
