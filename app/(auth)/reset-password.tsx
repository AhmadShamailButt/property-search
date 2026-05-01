import React, { useState } from 'react';
import { useRouter } from 'expo-router';

import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { useAuth } from '@/contexts/auth-context';
import { validatePassword, validatePasswordMatch } from '@/utils/validation';

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
        password: passwordError,
        confirmPassword: confirmError,
      });
      return;
    }
    setErrors({});
    setIsLoading(true);
    const { error } = await updatePassword(password);
    setIsLoading(false);
    if (error) {
      setErrors({ general: error });
      return;
    }
    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <AuthScreen icon="check-circle" title="Password Updated" subtitle="Your password has been reset successfully.">
        <Button label="Continue" variant="primary" size="lg" onPress={() => router.replace('/(tabs)')} />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen icon="lock" title="Set New Password" subtitle="Enter your new password below">
      {errors.general && <Banner tone="error">{errors.general}</Banner>}

      <Input
        label="New Password"
        icon="lock"
        placeholder="Min. 6 characters"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        error={errors.password}
      />
      <Input
        label="Confirm New Password"
        icon="lock"
        placeholder="Repeat your password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        error={errors.confirmPassword}
      />
      <Button label="Update Password" variant="primary" size="lg" onPress={handleUpdate} isLoading={isLoading} />
    </AuthScreen>
  );
}
