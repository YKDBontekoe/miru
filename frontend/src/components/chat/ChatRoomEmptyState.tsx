import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Agent } from '@/core/models';
import { theme } from '@/core/theme';

interface ChatRoomEmptyStateProps {
  roomAgents: Agent[];
}

export const ChatRoomEmptyState = ({ roomAgents }: ChatRoomEmptyStateProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={30}
          color={theme.colors.primary.DEFAULT}
        />
      </View>
      <AppText style={styles.title}>{t('chat.start_conversation')}</AppText>
      <AppText style={styles.subtitle}>
        {roomAgents.length > 0
          ? t('chat.room_agents_status', {
              count: roomAgents.length,
              names: roomAgents.map((a) => a.name).join(', '),
            })
          : t('chat.add_agent_to_start')}
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
    backgroundColor: theme.colors.primary.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    color: theme.colors.onSurface.light,
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
  },
  subtitle: {
    color: theme.colors.onSurface.disabledLight,
    textAlign: 'center',
    fontSize: 14,
  },
});
