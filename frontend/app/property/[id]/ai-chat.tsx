import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInUp } from 'react-native-reanimated';

export default function AiChatScreen() {
  const { theme } = StyleSheet.useTheme();
  
  const [messages, setMessages] = useState([
    { id: '1', role: 'ai', text: 'Hello! I am the AI assistant for the Modern Glass Villa. With an AI score of 9.8, this property is highly rated due to its pristine condition, modern 2022 build, and premium location. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');

  const sendMsg = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now().toString(), role: 'user', text: input }]);
    setInput('');
    setTimeout(() => {
      setMessages(m => [...m, { id: Date.now().toString(), role: 'ai', text: 'Based on the property documents, this villa has custom imported Italian marble and smart home integration throughout. (RAG Source: Description Docs)' }]);
    }, 1000);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={styles.title}>AI Property Assistant</Text>
          <Text style={styles.subtitle}>Modern Glass Villa</Text>
        </View>
        <View style={styles.aiBadge}>
          <Text style={styles.aiBadgeText}>9.8</Text>
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.chatArea}>
          {messages.map(msg => (
            <Animated.View entering={FadeInUp} key={msg.id} style={[styles.bubbleWrap, msg.role === 'user' ? styles.bubbleRight : styles.bubbleLeft]}>
              <View style={[styles.bubble, msg.role === 'user' ? styles.userBubble : styles.aiBubble]}>
                {msg.role === 'ai' && <Feather name="cpu" size={16} color={theme.colors.tint} style={{ marginBottom: 4 }} />}
                <Text style={[styles.bubbleText, msg.role === 'user' ? styles.userBubbleText : styles.aiBubbleText]}>{msg.text}</Text>
              </View>
            </Animated.View>
          ))}
        </ScrollView>

        <View style={styles.inputArea}>
          <TextInput 
            style={styles.input} 
            placeholder="Ask about materials, neighborhood, etc." 
            placeholderTextColor={theme.colors.textMuted}
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMsg}
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMsg}>
            <Feather name="send" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing(2), borderBottomWidth: 1, borderBottomColor: theme.colors.border },
  backBtn: { padding: theme.spacing(1), marginRight: theme.spacing(1) },
  headerTitle: { flex: 1 },
  title: { ...theme.typography.h3, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary },
  aiBadge: { backgroundColor: theme.colors.accent, width: 36, height: 36, borderRadius: theme.radii.round, justifyContent: 'center', alignItems: 'center' },
  aiBadgeText: { color: '#fff', ...theme.typography.label, fontWeight: '700' },
  chatArea: { padding: theme.spacing(3), gap: theme.spacing(2), flexGrow: 1 },
  bubbleWrap: { width: '100%', flexDirection: 'row' },
  bubbleRight: { justifyContent: 'flex-end' },
  bubbleLeft: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', padding: theme.spacing(2), borderRadius: theme.radii.lg },
  userBubble: { backgroundColor: theme.colors.tint, borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border, borderBottomLeftRadius: 4 },
  bubbleText: { ...theme.typography.body },
  userBubbleText: { color: '#ffffff' },
  aiBubbleText: { color: theme.colors.text },
  inputArea: { flexDirection: 'row', padding: theme.spacing(2), backgroundColor: theme.colors.surface, borderTopWidth: 1, borderTopColor: theme.colors.border, alignItems: 'center', gap: theme.spacing(2) },
  input: { flex: 1, backgroundColor: theme.colors.background, height: 48, borderRadius: theme.radii.round, paddingHorizontal: theme.spacing(2), color: theme.colors.text, borderWidth: 1, borderColor: theme.colors.border },
  sendBtn: { width: 48, height: 48, borderRadius: theme.radii.round, backgroundColor: theme.colors.tint, justifyContent: 'center', alignItems: 'center' },
}));
