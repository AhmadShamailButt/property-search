import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { sharedStyles, s } from '@/styles/shared';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendVerificationEmail } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [isError, setIsError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startCooldown = () => {
    setCooldown(60);
    intervalRef.current = setInterval(() => {
      setCooldown(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResend = async () => {
    if (!email || cooldown > 0) return;

    setIsResending(true);
    setMessage(undefined);
    setIsError(false);

    const { error } = await resendVerificationEmail(email);

    setIsResending(false);

    if (error) {
      setMessage(error);
      setIsError(true);
      return;
    }

    setMessage('Verification email sent! Check your inbox.');
    setIsError(false);
    startCooldown();
  };

  return (
    <ThemedView style={sharedStyles.fill}>
      <View style={[sharedStyles.fill, sharedStyles.center, s.p(3)]}>
        <View style={[sharedStyles.center, s.mb(3)]}>
          <MaterialIcons name="mark-email-unread" size={80} style={s.icon('primary')} />
        </View>

        <ThemedText type="title" style={{ textAlign: 'center' }}>Check Your Email</ThemedText>

        <ThemedText style={[s.color('textSecondary'), { textAlign: 'center' }, s.mt(1)]}>
          We've sent a verification link to
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={[{ textAlign: 'center' }, s.mt(0.5)]}>
          {email}
        </ThemedText>

        <ThemedText style={[s.color('textMuted'), s.fontSize(14), s.mt(2), s.px(2), { lineHeight: 20, textAlign: 'center' }]}>
          Click the link in the email to verify your account. If you don't see it, check your spam folder.
        </ThemedText>

        {message && (
          <View style={[s.banner(isError ? 'error' : 'success'), s.mt(2)]}>
            <ThemedText style={[s.bannerText(isError ? 'error' : 'success'), { textAlign: 'center' }]}>
              {message}
            </ThemedText>
          </View>
        )}

        <View style={[{ width: '100%' }, s.gap(2), s.mt(4)]}>
          <Button
            title={cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Email'}
            variant="outline"
            onPress={handleResend}
            isLoading={isResending}
            disabled={cooldown > 0}
          />

          <Button
            title="Back to Login"
            variant="secondary"
            onPress={() => router.replace('/(auth)/login')}
          />
        </View>
      </View>
    </ThemedView>
  );
}
