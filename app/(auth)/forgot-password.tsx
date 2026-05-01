import React, { useState } from 'react';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { AuthScreen, AuthFooterLink } from '@/components/ui/AuthScreen';
import { useAuth } from '@/contexts/auth-context';
import { validateEmail } from '@/utils/validation';

export default function ForgotPasswordScreen() {
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
    setIsLoading(false);
    if (resetError) {
      setError(resetError);
      return;
    }
    setIsSubmitted(true);
  };

  if (isSubmitted) {
    return (
      <AuthScreen icon="mail" title="Check Your Email" subtitle={`We've sent a reset link to ${email}`} showBack>
        <Banner tone="success">
          Click the link in the email to reset your password. If you don't see it, check your spam folder.
        </Banner>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      icon="lock"
      title="Reset Password"
      subtitle="Enter your email to receive a reset link"
      showBack
      footer={<AuthFooterLink text="Remember your password?" linkLabel="Log In" href="/(auth)/login" />}
    >
      <Input
        label="Email"
        icon="mail"
        placeholder="you@example.com"
        keyboardType="email-address"
        autoCapitalize="none"
        value={email}
        onChangeText={setEmail}
        error={error}
      />
      <Button label="Send Reset Link" variant="primary" size="lg" onPress={handleReset} isLoading={isLoading} />
    </AuthScreen>
  );
}
