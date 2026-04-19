import { View, type ViewProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

export function ThemedView({ style, ...otherProps }: ViewProps) {
  return <View style={[styles.container, style]} {...otherProps} />;
}

const styles = StyleSheet.create(theme => ({
  container: {
    backgroundColor: theme.colors.background,
  },
}));
