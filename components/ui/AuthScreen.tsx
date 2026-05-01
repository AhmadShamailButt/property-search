import React from 'react';
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Link, router, type Href } from 'expo-router';

interface AuthScreenProps {
  icon?: keyof typeof Feather.glyphMap;
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const AuthScreen = ({
  icon,
  title,
  subtitle,
  showBack = false,
  onBack,
  children,
  footer,
}: AuthScreenProps) => {
  const { theme } = useUnistyles();
  const handleBack = onBack ?? (() => router.back());

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {showBack && (
            <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
              <Feather name="arrow-left" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          )}

          <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
            {icon && (
              <View style={styles.logoContainer}>
                <Feather name={icon} size={40} color={theme.colors.tint} />
              </View>
            )}
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </Animated.View>

          <Animated.View entering={FadeInDown.delay(200)} style={styles.body}>
            {children}
          </Animated.View>

          {footer && (
            <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
              {footer}
            </Animated.View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

interface AuthFooterLinkProps {
  text: string;
  linkLabel: string;
  href: Href;
}

export const AuthFooterLink = ({ text, linkLabel, href }: AuthFooterLinkProps) => (
  <>
    <Text style={styles.footerText}>{text} </Text>
    <Link href={href}>
      <Text style={styles.footerLink}>{linkLabel}</Text>
    </Link>
  </>
);

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  scrollContent: {
    padding: theme.spacing(3),
    flexGrow: 1,
    justifyContent: 'center',
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: theme.spacing(2),
  },
  header: {
    alignItems: 'center',
    marginBottom: theme.spacing(5),
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing(2),
    ...theme.shadows.soft,
  },
  title: {
    ...theme.typography.h1,
    color: theme.colors.text,
    marginBottom: theme.spacing(1),
    textAlign: 'center',
  },
  subtitle: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    textAlign: 'center',
  },
  body: {
    gap: theme.spacing(2),
    marginBottom: theme.spacing(4),
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
  },
  footerLink: {
    ...theme.typography.label,
    color: theme.colors.tint,
  },
}));
