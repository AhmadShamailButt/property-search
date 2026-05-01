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
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from '@/utils/validation';
import { sharedStyles } from '@/styles/shared';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [isLoading, setIsLoading] = useState(false);

  const handleSignUp = async () => {
    const nameError = validateFullName(fullName);
    const emailError = validateEmail(email);
    const passwordError = validatePassword(password);
    const confirmError = validatePasswordMatch(password, confirmPassword);

    if (nameError || emailError || passwordError || confirmError) {
      setErrors({
        fullName: nameError ?? undefined,
        email: emailError ?? undefined,
        password: passwordError ?? undefined,
        confirmPassword: confirmError ?? undefined,
      });
      return;
    }

    setErrors({});
    setIsLoading(true);

    const { error } = await signUp(email, password, fullName);

    if (error) {
      setErrors({ general: error });
      setIsLoading(false);
      return;
    }

    setIsLoading(false);
    router.push({ pathname: '/(auth)/verify-email', params: { email } });
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

          <View style={styles.header}>
            <ThemedText type="title">Create Account</ThemedText>
            <ThemedText style={styles.subtitle}>
              Join us to find your dream property
            </ThemedText>
          </View>

          {errors.general && (
            <View style={styles.banner}>
              <ThemedText style={styles.bannerText}>{errors.general}</ThemedText>
            </View>
          )}

          <View>
            <Input
              label="Full Name"
              value={fullName}
              onChangeText={setFullName}
              placeholder="John Doe"
              autoCapitalize="words"
              icon="person"
              error={errors.fullName}
            />

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
              placeholder="Min. 6 characters"
              secureTextEntry
              icon="lock"
              error={errors.password}
            />

            <Input
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Repeat your password"
              secureTextEntry
              icon="lock"
              error={errors.confirmPassword}
            />

            <Button
              title="Create Account"
              onPress={handleSignUp}
              isLoading={isLoading}
            />
          </View>

          <View style={styles.footer}>
            <ThemedText style={styles.subtitle}>
              Already have an account?{' '}
            </ThemedText>
            <ThemedText type="link" onPress={() => router.back()}>
              Sign In
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
    paddingTop: theme.spacing(8),
  },
  backButton: {
    marginBottom: theme.spacing(2),
    alignSelf: 'flex-start',
  },
  backIcon: {
    color: theme.colors.text,
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
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing(4),
  },
}));
