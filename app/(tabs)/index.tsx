import { Pressable } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useAuth } from '@/contexts/auth-context';

export default function HomeScreen() {
  const { signOut, user } = useAuth();

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Property Search</ThemedText>
      {user?.email ? <ThemedText style={styles.email}>{user.email}</ThemedText> : null}
      <Pressable style={styles.button} onPress={signOut}>
        <ThemedText style={styles.buttonText}>Log out</ThemedText>
      </Pressable>
    </ThemedView>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.background,
    gap: 16,
  },
  email: {
    opacity: 0.7,
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: theme.colors.error,
  },
  buttonText: {
    color: theme.colors.textInverse,
    fontWeight: '600',
  },
}));
