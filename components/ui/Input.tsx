import React from 'react';
import { View, TextInput, Text, TextInputProps } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

interface InputProps extends TextInputProps {
  label?: string;
  icon?: keyof typeof Feather.glyphMap;
  error?: string;
}

export const Input = ({ label, icon, error, style, multiline, ...props }: InputProps) => {
  const { theme } = useUnistyles();
  styles.useVariants({ multiline: !!multiline });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.inputContainer, error && styles.inputError]}>
        {icon && <Feather name={icon} size={20} color={theme.colors.icon} style={styles.icon} />}
        <TextInput
          style={[styles.input, style]}
          placeholderTextColor={theme.colors.textMuted}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          {...props}
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create((theme) => ({
  container: { gap: theme.spacing(1), width: '100%' },
  label: { ...theme.typography.label, color: theme.colors.text },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    paddingHorizontal: theme.spacing(2),
    borderWidth: 1,
    borderColor: theme.colors.border,
    variants: {
      multiline: {
        true: {
          alignItems: 'flex-start',
          paddingVertical: theme.spacing(1.5),
          minHeight: theme.spacing(15),
        },
        false: {
          alignItems: 'center',
          height: theme.spacing(7),
        },
      },
    },
  },
  inputError: { borderColor: theme.colors.error },
  icon: { marginRight: theme.spacing(1) },
  input: { flex: 1, ...theme.typography.body, color: theme.colors.text },
  errorText: { ...theme.typography.caption, color: theme.colors.error },
}));
