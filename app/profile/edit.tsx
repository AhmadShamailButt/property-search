import React, { useEffect, useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView,
  ActivityIndicator, Image, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';
import { captureImageFromCamera, pickImageFromLibrary, uploadAvatarImage, type PickedImage } from '@/utils/uploadImage';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Banner } from '@/components/ui/Banner';
import { Section } from '@/components/ui/Section';

type ProfileForm = {
  full_name: string;
  avatar_url: string;
  phone: string;
  location: string;
};

const EMPTY_FORM: ProfileForm = { full_name: '', avatar_url: '', phone: '', location: '' };

export default function EditProfileScreen() {
  const { theme } = useUnistyles();
  const { user, refreshProfile } = useAuth();

  const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    (async () => {
      const { data, error: err } = await supabase
        .from('profiles')
        .select('full_name, avatar_url, phone, location')
        .eq('id', user.id)
        .single();
      if (cancelled) return;
      if (err) {
        setError(err.message);
      } else if (data) {
        setForm({
          full_name: data.full_name ?? '',
          avatar_url: data.avatar_url ?? '',
          phone: data.phone ?? '',
          location: data.location ?? '',
        });
      }
      setIsLoading(false);
    })();
    return () => { cancelled = true; };
  }, [user?.id]);

  const update = <K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const uploadPicked = async (picked: PickedImage | null) => {
    if (!user || !picked) return;
    setIsUploading(true);
    try {
      const url = await uploadAvatarImage(picked, user.id);
      update('avatar_url', url);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handlePickImage = () => {
    if (!user || isUploading) return;
    setError(null);
    Alert.alert(
      'Add photo',
      undefined,
      [
        {
          text: 'Take photo',
          onPress: async () => {
            try {
              const picked = await captureImageFromCamera();
              await uploadPicked(picked);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Camera unavailable');
            }
          },
        },
        {
          text: 'Choose from library',
          onPress: async () => {
            try {
              const picked = await pickImageFromLibrary();
              await uploadPicked(picked);
            } catch (e) {
              setError(e instanceof Error ? e.message : 'Photo library unavailable');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
  };

  const handleSave = async () => {
    if (!user) return;
    const name = form.full_name.trim();
    if (!name) {
      Alert.alert('Name required', 'Please enter your name before saving.');
      return;
    }
    setIsSaving(true);
    const { error: err } = await supabase
      .from('profiles')
      .update({
        full_name: name,
        avatar_url: form.avatar_url.trim() || null,
        phone: form.phone.trim() || null,
        location: form.location.trim() || null,
      })
      .eq('id', user.id);
    setIsSaving(false);
    if (err) {
      Alert.alert('Could not save', err.message);
      return;
    }
    void refreshProfile();
    router.back();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={theme.colors.tint} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.iconBtnPlaceholder} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {error ? <Banner tone="error">{error}</Banner> : null}

          <Section label="Avatar">
            <View style={styles.imageBlock}>
              {form.avatar_url ? (
                <View style={styles.avatarPreview}>
                  <Image source={{ uri: form.avatar_url }} style={styles.avatarImage} resizeMode="cover" />
                  <TouchableOpacity style={styles.imageRemove} onPress={() => update('avatar_url', '')}>
                    <Feather name="x" size={16} color={theme.colors.onImage} />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.imagePlaceholder} onPress={handlePickImage} disabled={isUploading}>
                  <Feather name="user" size={32} color={theme.colors.icon} />
                  <Text style={styles.imagePlaceholderText}>
                    {isUploading ? 'Uploading…' : 'Tap to choose photo'}
                  </Text>
                </TouchableOpacity>
              )}
              <Button
                label={form.avatar_url ? 'Replace photo' : 'Upload photo'}
                variant="outline"
                size="sm"
                icon="upload"
                fullWidth
                onPress={handlePickImage}
                isLoading={isUploading}
              />
            </View>
          </Section>

          <Section label="Details">
            <View style={styles.fieldStack}>
              <Input
                label="Full name"
                value={form.full_name}
                onChangeText={(v) => update('full_name', v)}
                placeholder="Your name"
              />
              <Input
                label="Phone"
                value={form.phone}
                onChangeText={(v) => update('phone', v)}
                placeholder="+1 555 123 4567"
                keyboardType="phone-pad"
              />
              <Input
                label="Location"
                value={form.location}
                onChangeText={(v) => update('location', v)}
                placeholder="City, Country"
              />
            </View>
          </Section>

          <Button
            label="Save changes"
            onPress={handleSave}
            isLoading={isSaving}
            fullWidth
            style={styles.saveBtnSpacing}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: theme.colors.background },
  center: { justifyContent: 'center', alignItems: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(1.5),
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  iconBtnPlaceholder: { width: 38, height: 38 },
  headerTitle: { ...theme.typography.h3, color: theme.colors.text },

  scroll: {
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(8),
    gap: theme.spacing(3),
  },

  imageBlock: { gap: theme.spacing(1.5), alignItems: 'center' },
  avatarPreview: {
    width: 128,
    height: 128,
    borderRadius: theme.radii.round,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  avatarImage: { width: '100%', height: '100%' },
  imageRemove: {
    position: 'absolute',
    top: theme.spacing(0.5),
    right: theme.spacing(0.5),
    width: 28,
    height: 28,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.scrimStrong,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholder: {
    width: 128,
    height: 128,
    borderRadius: theme.radii.round,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    gap: theme.spacing(0.5),
    paddingHorizontal: theme.spacing(2),
  },
  imagePlaceholderText: {
    ...theme.typography.caption,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },

  fieldStack: { gap: theme.spacing(1.5) },

  saveBtnSpacing: { marginTop: theme.spacing(1) },
}));
