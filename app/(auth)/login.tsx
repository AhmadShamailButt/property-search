import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { AuthScreen, AuthFooterLink } from '@/components/ui/AuthScreen';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail, validatePassword } from '@/utils/validation';

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
      setErrors({ email: emailError, password: passwordError });
      return;
    }

    setErrors({});
    setIsLoading(true);
    const { error } = await signIn(email, password);
    if (error) setErrors({ general: error });
    setIsLoading(false);
  };

  return (
    <AuthScreen
      icon="home"
      title="Welcome Back"
      subtitle="Enter your details to proceed"
      footer={<AuthFooterLink text="Don't have an account?" linkLabel="Sign Up" href="/(auth)/signup" />}
    >
      {errors.general && <Banner tone="error">{errors.general}</Banner>}

      <Input
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        error={errors.email}
      />
      <Input
        label="Password"
        icon="lock"
        placeholder="••••••••"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />

      <View style={styles.forgotRow}>
        <Text style={styles.forgotText} onPress={() => router.push('/(auth)/forgot-password')}>
          Forgot password?
        </Text>
      </View>

      <Button label="Log In" variant="primary" size="lg" onPress={handleSignIn} isLoading={isLoading} />
    </AuthScreen>
  );
}

const styles = StyleSheet.create((theme) => ({
  forgotRow: { alignItems: 'flex-end' },
  forgotText: { ...theme.typography.label, color: theme.colors.accent },
}));
