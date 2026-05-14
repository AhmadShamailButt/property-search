import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Modal, View, Text, TextInput, TouchableOpacity, FlatList,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';

import { PropertyCard } from '@/components/property/PropertyCard';
import { useHomeChat, type ChatMessage } from '@/hooks/useHomeChat';

interface Props {
  visible: boolean;
  onClose: () => void;
}

export const HomeChatSheet = ({ visible, onClose }: Props) => {
  const { theme } = useUnistyles();
  const { messages, pending, sendMessage } = useHomeChat();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  useEffect(() => {
    if (visible) {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: false }));
    }
  }, [visible, messages.length]);

  const handleSend = () => {
    const text = input;
    if (!text.trim() || pending) return;
    setInput('');
    sendMessage(text);
  };

  const renderItem = useCallback(
    ({ item }: { item: ChatMessage }) => <MessageBubble msg={item} onPick={onClose} />,
    [onClose],
  );

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View entering={FadeIn.duration(180)} exiting={FadeOut.duration(180)} style={styles.overlay}>
        <TouchableOpacity activeOpacity={1} style={styles.flex} onPress={onClose} />
        <Animated.View entering={SlideInDown.duration(220)} exiting={SlideOutDown.duration(220)} style={styles.sheet}>
          <View style={styles.handle} />
          <View style={styles.header}>
            <View style={styles.flex}>
              <Text style={styles.title}>Find your home</Text>
              <Text style={styles.subtitle}>Describe what you’re after — I’ll match listings.</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={8}>
              <Feather name="x" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={0}
          >
            <FlatList
              ref={listRef}
              data={messages}
              keyExtractor={(m) => m.id}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
              renderItem={renderItem}
              ListFooterComponent={
                pending ? (
                  <View style={styles.pendingRow}>
                    <ActivityIndicator size="small" color={theme.colors.tint} />
                    <Text style={styles.pendingText}>Thinking…</Text>
                  </View>
                ) : null
              }
            />

            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                value={input}
                onChangeText={setInput}
                placeholder="3-bed house with garden under $500k…"
                placeholderTextColor={theme.colors.textMuted}
                onSubmitEditing={handleSend}
                returnKeyType="send"
                editable={!pending}
                multiline
              />
              <TouchableOpacity
                style={[styles.sendBtn, (!input.trim() || pending) && styles.sendBtnDisabled]}
                onPress={handleSend}
                disabled={!input.trim() || pending}
              >
                <Feather name="send" size={20} color={theme.colors.textInverse} />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*\*(.+?)\*\*\*/g, '$1')
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/(^|\s)\*(?!\s)(.+?)\*(?=\s|$|[.,!?;:])/g, '$1$2')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/`([^`]+)`/g, '$1');
}

const MessageBubble = memo(function MessageBubble({
  msg,
  onPick,
}: { msg: ChatMessage; onPick: () => void }) {
  const isUser = msg.role === 'user';
  const text = useMemo(
    () => (isUser ? msg.text : stripMarkdown(msg.text)),
    [isUser, msg.text],
  );
  return (
    <View style={[styles.bubbleWrap, isUser ? styles.bubbleRight : styles.bubbleLeft]}>
      <View style={[styles.bubble, isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.bubbleText, isUser ? styles.userBubbleText : styles.aiBubbleText]}>
          {text}
        </Text>
      </View>
      {msg.properties && msg.properties.length > 0 && (
        <FlatList
          horizontal
          data={msg.properties}
          keyExtractor={(p) => String(p.id)}
          style={styles.carousel}
          contentContainerStyle={styles.cardsRow}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.9} onPress={onPick} style={styles.cardWrap}>
              <PropertyCard property={item} />
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: theme.colors.backdrop,
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: theme.colors.background,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    height: '92%',
    ...theme.shadows.strong,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.border,
    marginTop: theme.spacing(1.5),
    marginBottom: theme.spacing(1),
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(3),
    paddingVertical: theme.spacing(2),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    gap: theme.spacing(2),
  },
  title: { ...theme.typography.h2, color: theme.colors.text },
  subtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 2 },

  listContent: {
    padding: theme.spacing(2.5),
    gap: theme.spacing(1.5),
    flexGrow: 1,
  },
  bubbleWrap: { width: '100%' },
  bubbleLeft: { alignItems: 'flex-start' },
  bubbleRight: { alignItems: 'flex-end' },
  bubble: { maxWidth: '85%', padding: theme.spacing(1.75), borderRadius: theme.radii.lg },
  userBubble: { backgroundColor: theme.colors.tint, borderBottomRightRadius: 4 },
  aiBubble: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: 4,
  },
  bubbleText: { ...theme.typography.body },
  userBubbleText: { color: theme.colors.textInverse },
  aiBubbleText: { color: theme.colors.text },

  carousel: {
    alignSelf: 'stretch',
    marginHorizontal: -theme.spacing(2.5),
  },
  cardsRow: {
    gap: theme.spacing(1.5),
    paddingTop: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2.5),
  },
  cardWrap: { width: 280 },

  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(0.5),
  },
  pendingText: { ...theme.typography.caption, color: theme.colors.textSecondary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing(1.5),
    paddingHorizontal: theme.spacing(2.5),
    paddingTop: theme.spacing(1.5),
    paddingBottom: theme.spacing(2.5),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.background,
  },
  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.5),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.5 },
}));
