import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Image,
  Pressable,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';
import { router, useLocalSearchParams, useFocusEffect } from 'expo-router';

import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/auth-context';

type OtherParticipant = {
  id: string;
  full_name: string;
  avatar_url: string | null;
};

type ConversationContext = {
  id: string;
  searcher_id: string;
  owner_id: string;
  property_id: string | null;
  property_title: string | null;
  other: OtherParticipant | null;
};

type DbMessage = {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};

export default function ConversationScreen() {
  const { theme } = useUnistyles();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  const [ctx, setCtx] = useState<ConversationContext | null>(null);
  const [messages, setMessages] = useState<DbMessage[]>([]);
  const [draft, setDraft] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const tempIdRef = useRef(0);

  const loadConversation = useCallback(async () => {
    if (!user || !id) return;
    setError(null);
    const convoRes = await supabase
      .from('conversations')
      .select(`
        id, searcher_id, owner_id, property_id,
        property:properties ( title ),
        searcher:profiles!conversations_searcher_id_fkey ( id, full_name, avatar_url ),
        owner:profiles!conversations_owner_id_fkey ( id, full_name, avatar_url )
      `)
      .eq('id', id)
      .maybeSingle();

    if (convoRes.error) {
      setError(convoRes.error.message);
      setIsLoading(false);
      return;
    }
    const row = convoRes.data as unknown as {
      id: string;
      searcher_id: string;
      owner_id: string;
      property_id: string | null;
      property: { title: string } | { title: string }[] | null;
      searcher: OtherParticipant | OtherParticipant[] | null;
      owner: OtherParticipant | OtherParticipant[] | null;
    } | null;
    if (!row) {
      setError('Conversation not found.');
      setIsLoading(false);
      return;
    }

    const pickOne = <T,>(v: T | T[] | null): T | null =>
      Array.isArray(v) ? v[0] ?? null : v;
    const otherIsOwner = user.id === row.searcher_id;
    const other = otherIsOwner ? pickOne(row.owner) : pickOne(row.searcher);
    const property = pickOne(row.property);

    setCtx({
      id: row.id,
      searcher_id: row.searcher_id,
      owner_id: row.owner_id,
      property_id: row.property_id,
      property_title: property?.title ?? null,
      other,
    });

    const msgRes = await supabase
      .from('messages')
      .select('id, conversation_id, sender_id, body, created_at')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (!msgRes.error) {
      setMessages((msgRes.data ?? []) as DbMessage[]);
    }
    setIsLoading(false);
  }, [id, user]);

  useEffect(() => {
    loadConversation();
  }, [loadConversation]);

  useFocusEffect(
    useCallback(() => {
      loadConversation();
    }, [loadConversation]),
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || !user || !id || isSending) return;
    setIsSending(true);
    setError(null);
    const optimistic: DbMessage = {
      id: `optimistic-${++tempIdRef.current}`,
      conversation_id: id,
      sender_id: user.id,
      body: trimmed,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    setDraft('');

    const { data, error: err } = await supabase
      .from('messages')
      .insert({ conversation_id: id, sender_id: user.id, body: trimmed })
      .select('id, conversation_id, sender_id, body, created_at')
      .single();

    if (err || !data) {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
      setError(err?.message ?? 'Failed to send message');
    } else {
      setMessages((prev) => prev.map((m) => (m.id === optimistic.id ? (data as DbMessage) : m)));
    }
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <ActivityIndicator color={theme.colors.tint} />
      </SafeAreaView>
    );
  }

  if (error || !ctx) {
    return (
      <SafeAreaView style={[styles.container, styles.center]} edges={['top']}>
        <Text style={styles.errorText}>{error ?? 'Conversation unavailable.'}</Text>
        <TouchableOpacity onPress={() => router.back()} style={{ marginTop: 16 }}>
          <Text style={styles.errorLink}>Go back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="arrow-left" size={22} color={theme.colors.text} />
        </TouchableOpacity>

        <Pressable
          style={styles.headerCenter}
          onPress={() => ctx.other && router.push({ pathname: '/profile/[id]', params: { id: ctx.other.id } })}
          accessibilityRole="button"
          accessibilityLabel={`View ${ctx.other?.full_name ?? 'participant'}'s profile`}
        >
          {ctx.other?.avatar_url ? (
            <Image source={{ uri: ctx.other.avatar_url }} style={styles.headerAvatar} resizeMode="cover" />
          ) : (
            <View style={[styles.headerAvatar, styles.center, styles.headerAvatarPlaceholder]}>
              <Feather name="user" size={18} color={theme.colors.icon} />
            </View>
          )}
          <View style={{ flex: 1 }}>
            <Text style={styles.headerName} numberOfLines={1}>
              {ctx.other?.full_name ?? 'Conversation'}
            </Text>
            {ctx.property_title ? (
              <Text style={styles.headerSubtitle} numberOfLines={1}>{ctx.property_title}</Text>
            ) : null}
          </View>
        </Pressable>

        {ctx.property_id ? (
          <TouchableOpacity
            onPress={() => router.push(`/property/${ctx.property_id}`)}
            style={styles.iconBtn}
            hitSlop={10}
            accessibilityLabel="Open property"
          >
            <Feather name="home" size={20} color={theme.colors.text} />
          </TouchableOpacity>
        ) : (
          <View style={styles.iconBtnPlaceholder} />
        )}
      </View>

      <KeyboardAvoidShim>

        {error ? (
          <View style={styles.errorBanner}>
            <Feather name="alert-circle" size={14} color={theme.colors.error} />
            <Text style={styles.errorBannerText} numberOfLines={2}>{error}</Text>
            <TouchableOpacity onPress={() => setError(null)} hitSlop={8}>
              <Feather name="x" size={16} color={theme.colors.error} />
            </TouchableOpacity>
          </View>
        ) : null}

        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          style={styles.list}
          contentContainerStyle={styles.messageList}
          renderItem={({ item }) => {
            const isMine = item.sender_id === user?.id;
            return (
              <View style={[styles.messageRow, isMine ? styles.messageRowMine : styles.messageRowTheirs]}>
                <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={isMine ? styles.bubbleTextMine : styles.bubbleTextTheirs}>{item.body}</Text>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="message-circle" size={28} color={theme.colors.textMuted} />
              <Text style={styles.emptyText}>Send a message to start the conversation.</Text>
            </View>
          }
        />

        <View style={styles.composer}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Type a message..."
            placeholderTextColor={theme.colors.textMuted}
            style={styles.input}
            multiline
            maxLength={2000}
          />
          <TouchableOpacity
            onPress={handleSend}
            style={[styles.sendBtn, (!draft.trim() || isSending) && styles.sendBtnDisabled]}
            disabled={!draft.trim() || isSending}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            {isSending ? (
              <ActivityIndicator size="small" color={theme.colors.textInverse} />
            ) : (
              <Feather name="send" size={18} color={theme.colors.textInverse} />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidShim>
    </SafeAreaView>
  );
}

function KeyboardAvoidShim({ children, ...rest }: ViewProps) {
  if (Platform.OS === 'ios') {
    return (
      <KeyboardAvoidingView style={styles.flex} behavior="padding" keyboardVerticalOffset={60} {...rest}>
        {children}
      </KeyboardAvoidingView>
    );
  }
  return <View style={styles.flex} {...rest}>{children}</View>;
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  flex: { flex: 1 },
  center: { justifyContent: 'center', alignItems: 'center' },
  errorText: { ...theme.typography.body, color: theme.colors.textSecondary },
  errorLink: { ...theme.typography.label, color: theme.colors.tint, fontWeight: '600' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    gap: theme.spacing(1),
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    backgroundColor: theme.colors.card,
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
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1.25),
  },
  headerAvatar: { width: 36, height: 36, borderRadius: theme.radii.round },
  headerAvatarPlaceholder: { backgroundColor: theme.colors.surface, borderWidth: 1, borderColor: theme.colors.border },
  headerName: { ...theme.typography.label, color: theme.colors.text, fontWeight: '700' },
  headerSubtitle: { ...theme.typography.caption, color: theme.colors.textSecondary, marginTop: 1 },

  list: { flex: 1 },
  messageList: {
    padding: theme.spacing(2),
    gap: theme.spacing(1),
    flexGrow: 1,
  },
  messageRow: { flexDirection: 'row' },
  messageRowMine: { justifyContent: 'flex-end' },
  messageRowTheirs: { justifyContent: 'flex-start' },
  bubble: {
    maxWidth: '78%',
    paddingHorizontal: theme.spacing(1.75),
    paddingVertical: theme.spacing(1.25),
    borderRadius: theme.radii.lg,
  },
  bubbleMine: {
    backgroundColor: theme.colors.tint,
    borderBottomRightRadius: theme.radii.sm,
  },
  bubbleTheirs: {
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderBottomLeftRadius: theme.radii.sm,
  },
  bubbleTextMine: { ...theme.typography.body, color: theme.colors.textInverse },
  bubbleTextTheirs: { ...theme.typography.body, color: theme.colors.text },

  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: theme.spacing(1),
    paddingVertical: theme.spacing(8),
  },
  emptyText: { ...theme.typography.body, color: theme.colors.textMuted, textAlign: 'center' },

  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing(1),
    backgroundColor: theme.colors.errorBg,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1),
    marginHorizontal: theme.spacing(2),
    marginTop: theme.spacing(1),
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.error,
  },
  errorBannerText: { ...theme.typography.caption, color: theme.colors.error, flex: 1 },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing(1),
    paddingHorizontal: theme.spacing(2),
    paddingTop: theme.spacing(1),
    paddingBottom: theme.spacing(2),
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.card,
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 120,
    paddingHorizontal: theme.spacing(2),
    paddingVertical: theme.spacing(1.25),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.border,
    color: theme.colors.text,
    ...theme.typography.body,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: { opacity: 0.4 },
}));
