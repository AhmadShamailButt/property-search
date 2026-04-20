import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';
import { sharedStyles, s } from '@/styles/shared';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const { updatePassword } = useAuth();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleUpdate = async () => {
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordMatch(password, confirmPassword);

    if (passwordError || confirmError) {
      setErrors({
        password: passwordError ?? undefined,
        confirmPassword: confirmError ?? undefined,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      setErrors({ general: error });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <ThemedView style={sharedStyles.fill}>
        <View style={[sharedStyles.fill, sharedStyles.center, s.p(3), s.gap(2)]}>
          <MaterialIcons name="check-circle" size={80} style={s.icon('success')} />
          <ThemedText type="title" style={{ textAlign: 'center' }}>Password Updated</ThemedText>
          <ThemedText style={[s.color('textSecondary'), { textAlign: 'center' }, s.mb(2)]}>
            Your password has been reset successfully.
          </ThemedText>
          <Button
            title="Continue"
            onPress={() => router.replace('/(tabs)')}
          />
        </View>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={sharedStyles.fill}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={sharedStyles.fill}>
        <ScrollView
          contentContainerStyle={s.content('center')}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={[sharedStyles.center, s.mb(3)]}>
            <MaterialIcons name="lock" size={64} style={s.icon('primary')} />
          </View>

          <View style={s.mb(4)}>
            <ThemedText type="title">Set New Password</ThemedText>
            <ThemedText style={[s.color('textSecondary'), s.mt(1)]}>
              Enter your new password below
            </ThemedText>
          </View>

          {errors.general && (
            <View style={s.banner('error')}>
              <ThemedText style={s.bannerText('error')}>{errors.general}</ThemedText>
            </View>
          )}

          <View style={s.gap(1)}>
            <Input
              label="New Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Min. 6 characters"
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <Input
              label="Confirm New Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry
              icon="lock"
              error={errors.confirmPassword}
            />

            <Button
              title="Update Password"
              onPress={handleUpdate}
              isLoading={isLoading}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ThemedView>
  );
}
