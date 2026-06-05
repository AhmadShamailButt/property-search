import React, { useState } from 'react';
import { TouchableOpacity, View } from 'react-native';
import { StyleSheet, useUnistyles } from 'react-native-unistyles';
import { Feather } from '@expo/vector-icons';

import { HomeChatSheet } from './HomeChatSheet';

export const ChatFAB = () => {
  const { theme } = useUnistyles();
  const [visible, setVisible] = useState(false);

  return (
    <>
      <View style={styles.wrap} pointerEvents="box-none">
        <TouchableOpacity
          activeOpacity={0.9}
          style={styles.fab}
          onPress={() => setVisible(true)}
          accessibilityRole="button"
          accessibilityLabel="Open AI property assistant"
        >
          <Feather name="message-square" size={24} color={theme.colors.textInverse} />
        </TouchableOpacity>
      </View>
      <HomeChatSheet visible={visible} onClose={() => setVisible(false)} />
    </>
  );
};

const styles = StyleSheet.create((theme) => ({
  wrap: {
    position: 'absolute',
    right: theme.spacing(2.5),
    bottom: 88,
    zIndex: 100,
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: theme.radii.round,
    backgroundColor: theme.colors.tint,
    justifyContent: 'center',
    alignItems: 'center',
    ...theme.shadows.strong,
  },
}));
