import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { Agent } from '../../core/models';
import { theme } from '../../core/theme';

const C = {
  text: '#12121A',
  muted: '#6E6E80',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
};

interface ChatRoomEmptyStateProps {
  roomAgents: Agent[];
}

export const ChatRoomEmptyState = ({ roomAgents }: ChatRoomEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={30} color={C.primary} />
      </View>
      <AppText style={styles.title}>{t('chat.start_conversation')}</AppText>
      <AppText style={styles.subtitle}>
        {roomAgents.length > 0
          ? `${roomAgents.map((a) => a.name).join(', ')} ${roomAgents.length === 1 ? 'is' : 'are'} ready to help.`
          : 'Add an agent to get started.'}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: C.text,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  subtitle: {
    color: C.muted,
    textAlign: 'center',
    fontSize: 14,
  },
});
