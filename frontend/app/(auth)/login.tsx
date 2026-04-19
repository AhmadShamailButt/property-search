import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Link, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginScreen() {
  const { theme } = StyleSheet.useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <View style={styles.logoContainer}>
            <Feather name="home" size={40} color={theme.colors.tint} />
          </View>
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Enter your details to proceed</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
          <Input 
            label="Email" 
            icon="mail" 
            placeholder="you@example.com" 
            value={email}
            onChangeText={setEmail}
          />
          <Input 
            label="Password" 
            icon="lock" 
            placeholder="••••••••" 
            secureTextEntry 
            value={password}
            onChangeText={setPassword}
          />

          <Link href="/(auth)/forgot-password" asChild>
            <Text style={styles.forgotText}>Forgot password?</Text>
          </Link>

          <Button 
            label="Log In" 
            variant="primary" 
            size="lg" 
            onPress={() => router.replace('/(tabs)')} 
            style={{ marginTop: theme.spacing(2) }}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
          <Text style={styles.footerText}>Don't have an account? </Text>
          <Link href="/(auth)/register">
            <Text style={styles.footerLink}>Sign Up</Text>
          </Link>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing(3), flexGrow: 1, justifyContent: 'center' },
  header: { alignItems: 'center', marginBottom: theme.spacing(5) },
  logoContainer: { width: 80, height: 80, borderRadius: theme.radii.round, backgroundColor: theme.colors.surface, justifyContent: 'center', alignItems: 'center', marginBottom: theme.spacing(2), ...theme.shadows.soft },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing(1) },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  form: { gap: theme.spacing(2), marginBottom: theme.spacing(4) },
  forgotText: { ...theme.typography.label, color: theme.colors.accent, alignSelf: 'flex-end' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...theme.typography.body, color: theme.colors.textSecondary },
  footerLink: { ...theme.typography.label, color: theme.colors.tint },
}));
