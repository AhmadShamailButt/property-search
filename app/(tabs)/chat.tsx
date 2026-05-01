import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';

export default function ChatScreen() {
  const { theme } = useUnistyles();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Messages</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Sample chat block */}
        <TouchableOpacity style={styles.chatRow}>
          <Image source={{ uri: 'https://i.pravatar.cc/150?u=owner1' }} style={styles.avatar} />
          <View style={styles.chatInfo}>
            <View style={styles.chatHeader}>
              <Text style={styles.chatName}>Sarah Jenkins</Text>
              <Text style={styles.chatTime}>12:30 PM</Text>
            </View>
            <Text style={styles.chatLastMessage} numberOfLines={1}>Yes, the villa is still available for viewing this weekend.</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create((theme) => ({
  container: { flex: 1, backgroundColor: theme.colors.background },
  header: { padding: theme.spacing(3), paddingBottom: theme.spacing(1) },
  title: { ...theme.typography.h1, color: theme.colors.text },
  scroll: { padding: theme.spacing(2) },
  chatRow: { flexDirection: 'row', alignItems: 'center', padding: theme.spacing(2), backgroundColor: theme.colors.surface, borderRadius: theme.radii.lg, marginBottom: theme.spacing(1.5), borderWidth: 1, borderColor: theme.colors.border },
  avatar: { width: 50, height: 50, borderRadius: theme.radii.round, marginRight: theme.spacing(2) },
  chatInfo: { flex: 1 },
  chatHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: theme.spacing(0.5) },
  chatName: { ...theme.typography.label, color: theme.colors.text },
  chatTime: { ...theme.typography.caption, color: theme.colors.textMuted },
  chatLastMessage: { ...theme.typography.body, color: theme.colors.textSecondary, fontSize: 14 },
}));
