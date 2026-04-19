import React from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Link, router } from 'expo-router';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Feather } from '@expo/vector-icons';

export default function RegisterScreen() {
  const { theme } = StyleSheet.useTheme();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeInDown.delay(100)} style={styles.header}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Join us to find your dream property</Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200)} style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputContainer}>
              <Feather name="mail" size={20} color={theme.colors.icon} />
              <TextInput style={styles.input} placeholder="you@example.com" placeholderTextColor={theme.colors.textMuted} />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="lock" size={20} color={theme.colors.icon} />
              <TextInput style={styles.input} placeholder="••••••••" secureTextEntry placeholderTextColor={theme.colors.textMuted} />
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={styles.inputContainer}>
              <Feather name="check" size={20} color={theme.colors.icon} />
              <TextInput style={styles.input} placeholder="••••••••" secureTextEntry placeholderTextColor={theme.colors.textMuted} />
            </View>
          </View>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => router.replace('/(tabs)')}>
            <Text style={styles.primaryBtnText}>Sign Up</Text>
          </TouchableOpacity>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(300)} style={styles.footer}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity>
              <Text style={styles.footerLink}>Log In</Text>
            </TouchableOpacity>
          </Link>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  scrollContent: { padding: theme.spacing(3), flexGrow: 1, justifyContent: 'center' },
  header: { marginBottom: theme.spacing(5) },
  title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing(1) },
  subtitle: { ...theme.typography.body, color: theme.colors.textSecondary },
  form: { gap: theme.spacing(2), marginBottom: theme.spacing(4) },
  inputGroup: { gap: theme.spacing(1) },
  label: { ...theme.typography.label, color: theme.colors.text },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, paddingHorizontal: theme.spacing(2), height: 56, borderWidth: 1, borderColor: theme.colors.border },
  input: { flex: 1, marginLeft: theme.spacing(1), ...theme.typography.body, color: theme.colors.text },
  primaryBtn: { backgroundColor: theme.colors.tint, height: 56, borderRadius: theme.radii.round, justifyContent: 'center', alignItems: 'center', marginTop: theme.spacing(2), ...theme.shadows.soft },
  primaryBtnText: { ...theme.typography.h3, color: '#ffffff' },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  footerText: { ...theme.typography.body, color: theme.colors.textSecondary },
  footerLink: { ...theme.typography.label, color: theme.colors.tint },
}));
