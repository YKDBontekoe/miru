import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ChatRoomEmptyStateProps {
  roomAgents: Agent[];
  suggestions?: string[];
  onSuggestionPress?: (suggestion: string) => void;
}

export const ChatRoomEmptyState = ({
  roomAgents,
  suggestions = [],
  onSuggestionPress,
}: ChatRoomEmptyStateProps) => {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: C.border,
          backgroundColor: C.surface,
          ...theme.elevation.md,
        },
      ]}
    >
      <View
        style={[
          styles.iconContainer,
          { backgroundColor: C.primarySurface },
        ]}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={34} color={C.primary} />
      </View>
      <AppText style={[styles.title, { color: C.text }]}>
        {t('chat.start_conversation')}
      </AppText>
      <AppText style={[styles.subtitle, { color: C.muted }]}>
        {roomAgents.length > 0
          ? t('chat.room_agents_status', {
              count: roomAgents.length,
              names: roomAgents.map((a) => a.name).join(', '),
            })
          : t('chat.add_agent_to_start')}
      </AppText>
      {suggestions.length > 0 && onSuggestionPress ? (
        <View style={styles.suggestionsContainer}>
          {suggestions.map((suggestion, index) => (
            <ScalePressable
              key={`${suggestion}-${index}`}
              onPress={() => onSuggestionPress(suggestion)}
              style={[
                styles.suggestionChip,
                {
                  borderColor: `${C.primary}4D`,
                  backgroundColor: C.primarySurface,
                },
              ]}
              accessibilityRole="button"
              accessibilityLabel={suggestion}
            >
              <AppText variant="caption" style={[styles.suggestionText, { color: C.primary }]}>
                {suggestion}
              </AppText>
            </ScalePressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 10,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: 52,
    borderWidth: 1,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: theme.typography.h3.fontSize,
    lineHeight: 26,
    fontWeight: 'bold',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: theme.typography.bodySm.fontSize,
    lineHeight: theme.typography.bodySm.lineHeight,
    letterSpacing: theme.typography.bodySm.letterSpacing,
    textAlign: 'center',
    paddingHorizontal: 14,
  },
  suggestionsContainer: {
    marginTop: theme.spacing.lg,
    width: '100%',
  },
  suggestionChip: {
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  suggestionText: {
    fontWeight: 'bold',
  },
});
