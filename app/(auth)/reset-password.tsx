import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';
import { sharedStyles } from '@/styles/shared';

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
        <View style={styles.successContainer}>
          <MaterialIcons name="check-circle" size={80} style={styles.successIcon} />
          <ThemedText type="title" style={styles.centerText}>Password Updated</ThemedText>
          <ThemedText style={styles.successBody}>
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
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.iconWrap}>
            <MaterialIcons name="lock" size={64} style={styles.bigIcon} />
          </View>

          <View style={styles.header}>
            <ThemedText type="title">Set New Password</ThemedText>
            <ThemedText style={styles.subtitle}>
              Enter your new password below
            </ThemedText>
          </View>

          {errors.general && (
            <View style={styles.banner}>
              <ThemedText style={styles.bannerText}>{errors.general}</ThemedText>
            </View>
          )}

          <View style={styles.formGap}>
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

const styles = StyleSheet.create(theme => ({
  content: {
    flexGrow: 1,
    padding: theme.spacing(3),
    justifyContent: 'center',
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
  formGap: {
    gap: theme.spacing(1),
  },
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
    gap: theme.spacing(2),
  },
  successIcon: {
    color: theme.colors.success,
  },
  successBody: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginBottom: theme.spacing(2),
  },
  centerText: {
    textAlign: 'center',
  },
}));
