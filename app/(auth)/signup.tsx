import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { AuthScreen, AuthFooterLink } from '@/components/ui/AuthScreen';
import { useAuth } from '@/contexts/auth-context';
import {
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateFullName,
} from '@/utils/validation';

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
        fullName: nameError,
        email: emailError,
        password: passwordError,
        confirmPassword: confirmError,
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
    router.replace({ pathname: '/(auth)/verify-email', params: { email } });
  };

  return (
    <AuthScreen
      icon="user-plus"
      title="Create Account"
      subtitle="Join us to find your dream property"
      showBack
      footer={<AuthFooterLink text="Already have an account?" linkLabel="Log In" href="/(auth)/login" />}
    >
      {errors.general && <Banner tone="error">{errors.general}</Banner>}

      <Input
        label="Full Name"
        icon="user"
        placeholder="John Doe"
        autoCapitalize="words"
        value={fullName}
        onChangeText={setFullName}
        error={errors.fullName}
      />
      <Input
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        error={errors.email}
      />
      <Input
        label="Password"
        icon="lock"
        placeholder="Min. 6 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <Input
        label="Confirm Password"
        icon="lock"
        placeholder="Repeat your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
      />

      <Button label="Create Account" variant="primary" size="lg" onPress={handleSignUp} isLoading={isLoading} />
    </AuthScreen>
  );
}
