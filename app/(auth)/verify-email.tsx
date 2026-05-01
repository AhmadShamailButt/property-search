import React, { useEffect, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { AuthScreen } from '@/components/ui/AuthScreen';
import { useAuth } from '@/contexts/auth-context';

type FeedbackBanner = { tone: 'success' | 'error'; text: string };

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendVerificationEmail } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [feedback, setFeedback] = useState<FeedbackBanner | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearCooldownInterval = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => clearCooldownInterval, []);

  const startCooldown = () => {
    clearCooldownInterval();
    setCooldown(60);
    intervalRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearCooldownInterval();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;
    setIsResending(true);
    setFeedback(null);
    const { error } = await resendVerificationEmail(email);
    setIsResending(false);
    if (error) {
      setFeedback({ tone: 'error', text: error });
      return;
    }
    setFeedback({ tone: 'success', text: 'Verification email sent! Check your inbox.' });
    startCooldown();
  };

  return (
    <AuthScreen
      icon="mail"
      title="Check Your Email"
      subtitle={`We've sent a verification link to ${email ?? 'your email'}`}
    >
      <Banner tone="info">
        Click the link in the email to verify your account. If you don't see it, check your spam folder.
      </Banner>

      {feedback && <Banner tone={feedback.tone}>{feedback.text}</Banner>}

      <Button
        label={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
        variant="outline"
        size="lg"
        onPress={handleResend}
        isLoading={isResending}
        disabled={cooldown > 0}
      />
      <Button
        label="Back to Login"
        variant="ghost"
        size="lg"
        onPress={() => router.replace('/(auth)/login')}
      />
    </AuthScreen>
  );
}
