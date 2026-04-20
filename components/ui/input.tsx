import React, { useState } from 'react';
import { TextInput, View, Pressable, type TextInputProps } from 'react-native';
import { StyleSheet } from 'react-native-unistyles';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

import { ThemedText } from '@/components/themed-text';

type InputProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: keyof typeof MaterialIcons.glyphMap;
};

export function Input({
  label,
  error,
  icon,
  secureTextEntry,
  style,
  ...props
}: InputProps) {
  const [isSecureVisible, setIsSecureVisible] = useState(false);
  const isSecure = secureTextEntry && !isSecureVisible;

  return (
    <View style={styles.container}>
      {label && <ThemedText style={styles.label}>{label}</ThemedText>}
      <View style={[styles.inputWrapper, error ? styles.inputError : undefined]}>
        {icon && (
          <MaterialIcons
            name={icon}
            size={20}
            style={styles.icon}
          />
        )}
        <TextInput
          style={[styles.input, style]}
          secureTextEntry={isSecure}
          placeholderTextColor={styles.placeholder.color}
          autoCorrect={false}
          {...props}
        />
        {secureTextEntry && (
          <Pressable onPress={() => setIsSecureVisible(prev => !prev)} hitSlop={8}>
            <MaterialIcons
              name={isSecureVisible ? 'visibility' : 'visibility-off'}
              size={20}
              style={styles.icon}
            />
          </Pressable>
        )}
      </View>
      {error && <ThemedText style={styles.error}>{error}</ThemedText>}
    </View>
  );
}

const styles = StyleSheet.create(theme => ({
  container: {
    marginBottom: theme.spacing(2),
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    color: theme.colors.text,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 52,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 12,
    backgroundColor: theme.colors.surface,
    paddingHorizontal: theme.spacing(2),
  },
  inputError: {
    borderColor: theme.colors.error,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: theme.colors.text,
    height: '100%',
  },
  placeholder: {
    color: theme.colors.textMuted,
  },
  icon: {
    color: theme.colors.textMuted,
    marginRight: 8,
  },
  error: {
    fontSize: 12,
    color: theme.colors.error,
    marginTop: 4,
  },
}));
