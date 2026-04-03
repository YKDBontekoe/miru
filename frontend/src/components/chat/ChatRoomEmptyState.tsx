import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Agent } from '@/core/models';
import { theme } from '@/core/theme';

interface ChatRoomEmptyStateProps {
  roomAgents: Agent[];
}

export const ChatRoomEmptyState = ({ roomAgents }: ChatRoomEmptyStateProps) => {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDark
              ? theme.colors.surface.highestDark
              : theme.colors.primary.surfaceLight,
          },
        ]}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={theme.spacing.xxxl}
          color={theme.colors.primary.DEFAULT}
        />
      </View>
      <AppText
        style={[
          styles.title,
          {
            color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
          },
        ]}
      >
        {t('chat.start_conversation')}
      </AppText>
      <AppText
        style={[
          styles.subtitle,
          {
            color: isDark
              ? theme.colors.onSurface.disabledDark
              : theme.colors.onSurface.disabledLight,
          },
        ]}
      >
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
    paddingVertical: theme.spacing.colossal,
  },
  iconContainer: {
    width: theme.spacing.colossal,
    height: theme.spacing.colossal,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.md,
  },
  title: {
    ...theme.typography.h3,
    marginBottom: theme.spacing.xs,
  },
  subtitle: {
    ...theme.typography.bodySm,
    textAlign: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
});
