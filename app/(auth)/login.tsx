import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail, validatePassword } from '@/utils/validation';
import { sharedStyles } from '@/styles/shared';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);

    if (emailError || passwordError) {
      setErrors({ email: emailError ?? undefined, password: passwordError ?? undefined });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const { error } = await signIn(email, password);

    if (error) {
      setErrors({ general: error });
    }

    setIsLoading(false);
  };

  return (
    <ThemedView style={sharedStyles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={sharedStyles.fill}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <ThemedText type="title">Welcome Back</ThemedText>
            <ThemedText style={styles.subtitle}>
              Sign in to continue searching properties
            </ThemedText>
          </View>

          {errors.general && (
            <View style={styles.banner}>
              <ThemedText style={styles.bannerText}>{errors.general}</ThemedText>
            </View>
          )}

          <View>
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              icon="email"
              error={errors.email}
            />

            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Enter your password"
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <ThemedText
              style={styles.forgotLink}
              onPress={() => router.push('/(auth)/forgot-password')}>
              Forgot Password?
            </ThemedText>

            <Button
              title="Sign In"
              onPress={handleSignIn}
              isLoading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.subtitle}>
              Don't have an account?{' '}
            </ThemedText>
            <ThemedText
              type="link"
              onPress={() => router.push('/(auth)/signup')}>
              Sign Up
            </ThemedText>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create(theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    justifyContent: 'center',
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  subtitle: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
  },
  banner: {
    backgroundColor: theme.colors.error + '15',
    borderRadius: 12,
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
  },
  bannerText: {
    color: theme.colors.error,
    fontSize: 14,
  },
  forgotLink: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
    marginBottom: theme.spacing(3),
    marginTop: -theme.spacing(1),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing(4),
  },
}));
