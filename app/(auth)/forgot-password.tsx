import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail } from '@/utils/validation';
import { sharedStyles } from '@/styles/shared';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();

  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleReset = async () => {
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    setError(undefined);
    setIsLoading(true);

    const { error: resetError } = await resetPassword(email);

    if (resetError) {
      setError(resetError);
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSubmitted(true);
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
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <MaterialIcons name="chevron-left" size={28} style={styles.backIcon} />
          </Pressable>

          <View style={styles.iconWrap}>
            <MaterialIcons name="lock-reset" size={64} style={styles.bigIcon} />
          </View>

          {isSubmitted ? (
            <View>
              <ThemedText type="title">Check Your Email</ThemedText>
              <ThemedText style={styles.bodyText}>
                We've sent a password reset link to{' '}
                <ThemedText type="defaultSemiBold">{email}</ThemedText>
              </ThemedText>
              <ThemedText style={styles.helperText}>
                Click the link in the email to reset your password. If you don't see it, check your spam folder.
              </ThemedText>
              <Button
                title="Back to Login"
                variant="outline"
                onPress={() => router.back()}
              />
            </View>
          ) : (
            <>
              <View style={styles.header}>
                <ThemedText type="title">Forgot Password?</ThemedText>
                <ThemedText style={styles.bodyText}>
                  Enter your email address and we'll send you a link to reset your password
                </ThemedText>
              </View>

              <View style={styles.formGap}>
                <Input
                  label="Email"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  icon="email"
                  error={error}
                />

                <Button
                  title="Send Reset Link"
                  onPress={handleReset}
                  isLoading={isLoading}
                />
              </View>

              <View style={styles.footer}>
                <ThemedText style={styles.subtitle}>
                  Remember your password?{' '}
                </ThemedText>
                <ThemedText type="link" onPress={() => router.back()}>
                  Sign In
                </ThemedText>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}

const styles = StyleSheet.create(theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    paddingTop: theme.spacing(8),
  },
  backButton: {
    marginBottom: theme.spacing(2),
    alignSelf: 'flex-start',
  },
  backIcon: {
    color: theme.colors.text,
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
  },
  bigIcon: {
    color: theme.colors.primary,
  },
  header: {
    marginBottom: theme.spacing(4),
  },
  subtitle: {
    color: theme.colors.textSecondary,
  },
  bodyText: {
    color: theme.colors.textSecondary,
    marginTop: theme.spacing(1),
    lineHeight: 22,
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(4),
    lineHeight: 20,
  },
  formGap: {
    gap: theme.spacing(1),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing(4),
  },
}));
