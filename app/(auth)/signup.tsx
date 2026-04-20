import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, View } from 'react-native';
import { useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

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
import { sharedStyles, s } from '@/styles/shared';

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
          contentContainerStyle={s.content('top')}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <Pressable onPress={() => router.back()} style={[s.mb(2), { alignSelf: 'flex-start' }]}>
            <MaterialIcons name="chevron-left" size={28} style={s.icon('text')} />
          </Pressable>

          <View style={s.mb(4)}>
            <ThemedText type="title">Create Account</ThemedText>
            <ThemedText style={[s.color('textSecondary'), s.mt(1)]}>
              Join us to find your dream property
            </ThemedText>
          </View>

          {errors.general && (
            <View style={s.banner('error')}>
              <ThemedText style={s.bannerText('error')}>{errors.general}</ThemedText>
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

          <View style={[sharedStyles.row, { justifyContent: 'center' }, s.mt(4)]}>
            <ThemedText style={s.color('textSecondary')}>
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
