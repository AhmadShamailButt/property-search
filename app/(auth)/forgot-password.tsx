import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail } from '@/utils/validation';
import { sharedStyles, s } from '@/styles/shared';

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
          contentContainerStyle={s.content('top')}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={[s.mb(2), { alignSelf: 'flex-start' }]}>
            <MaterialIcons name="chevron-left" size={28} style={s.icon('text')} />
          </Pressable>

          <View style={[sharedStyles.center, s.mb(3)]}>
            <MaterialIcons name="lock-reset" size={64} style={s.icon('primary')} />
          </View>

          {isSubmitted ? (
            <View>
              <ThemedText type="title">Check Your Email</ThemedText>
              <ThemedText style={[s.color('textSecondary'), s.mt(1), { lineHeight: 22 }]}>
                We've sent a password reset link to{' '}
                <ThemedText type="defaultSemiBold">{email}</ThemedText>
              </ThemedText>
              <ThemedText style={[s.color('textMuted'), s.fontSize(14), s.mt(2), s.mb(4), { lineHeight: 20 }]}>
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
              <View style={s.mb(4)}>
                <ThemedText type="title">Forgot Password?</ThemedText>
                <ThemedText style={[s.color('textSecondary'), s.mt(1), { lineHeight: 22 }]}>
                  Enter your email address and we'll send you a link to reset your password
                </ThemedText>
              </View>

              <View style={s.gap(1)}>
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

              <View style={[sharedStyles.row, { justifyContent: 'center' }, s.mt(4)]}>
                <ThemedText style={s.color('textSecondary')}>
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
