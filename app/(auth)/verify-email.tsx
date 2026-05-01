import React, { useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { StyleSheet } from 'react-native-unistyles';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { sharedStyles } from '@/styles/shared';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { email } = useLocalSearchParams<{ email: string }>();
  const { resendVerificationEmail } = useAuth();

  const [isResending, setIsResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [message, setMessage] = useState<string | undefined>();
  const [isError, setIsError] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  styles.useVariants({ tone: isError ? 'error' : 'success' });

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
      <View style={styles.container}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="mark-email-unread" size={80} style={styles.bigIcon} />
        </View>

        <ThemedText type="title" style={styles.centerText}>Check Your Email</ThemedText>

        <ThemedText style={styles.sentTo}>
          We've sent a verification link to
        </ThemedText>
        <ThemedText type="defaultSemiBold" style={styles.emailText}>
          {email}
        </ThemedText>

        <ThemedText style={styles.helperText}>
          Click the link in the email to verify your account. If you don't see it, check your spam folder.
        </ThemedText>

        {message && (
          <View style={styles.banner}>
            <ThemedText style={styles.bannerText}>
              {message}
            </ThemedText>
          </View>
        )}

        <View style={styles.actions}>
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

const styles = StyleSheet.create(theme => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(3),
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing(3),
  },
  bigIcon: {
    color: theme.colors.primary,
  },
  centerText: {
    textAlign: 'center',
  },
  sentTo: {
    color: theme.colors.textSecondary,
    textAlign: 'center',
    marginTop: theme.spacing(1),
  },
  emailText: {
    textAlign: 'center',
    marginTop: theme.spacing(0.5),
  },
  helperText: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: theme.spacing(2),
    paddingHorizontal: theme.spacing(2),
    lineHeight: 20,
    textAlign: 'center',
  },
  banner: {
    borderRadius: 12,
    padding: theme.spacing(2),
    marginTop: theme.spacing(2),
    variants: {
      tone: {
        error: { backgroundColor: theme.colors.error + '15' },
        success: { backgroundColor: theme.colors.success + '15' },
      },
    },
  },
  bannerText: {
    fontSize: 14,
    textAlign: 'center',
    variants: {
      tone: {
        error: { color: theme.colors.error },
        success: { color: theme.colors.success },
      },
    },
  },
  actions: {
    width: '100%',
    gap: theme.spacing(2),
    marginTop: theme.spacing(4),
  },
}));
