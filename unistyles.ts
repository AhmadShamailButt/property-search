import { StyleSheet } from 'react-native-unistyles'
import { Colors } from './constants/colors'

const lightTheme = {
  colors: Colors.light,
  spacing: (v: number) => v * 8,
} as const

const darkTheme = {
  colors: Colors.dark,
  spacing: (v: number) => v * 8,
} as const

const breakpoints = {
  xs: 0,
  sm: 360,
  md: 500,
  lg: 800,
  xl: 1200,
} as const

type AppThemes = { light: typeof lightTheme; dark: typeof darkTheme }
type AppBreakpoints = typeof breakpoints

declare module 'react-native-unistyles' {
  export interface UnistylesThemes extends AppThemes {}
  export interface UnistylesBreakpoints extends AppBreakpoints {}
}

StyleSheet.configure({
  themes: { light: lightTheme, dark: darkTheme },
  breakpoints,
  settings: { adaptiveThemes: true },
})
