import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { ScalePressable } from '@/components/ScalePressable';

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

  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Ionicons name="chatbubble-ellipses-outline" size={34} color={DESIGN_TOKENS.colors.primary} />
      </View>
      <AppText style={styles.title}>
        {t('chat.start_conversation')}
      </AppText>
      <AppText style={styles.subtitle}>
        {roomAgents.length > 0
          ? t('chat.room_agents_status', {
              count: roomAgents.length,
              names: roomAgents.map((a) => a.name).join(', '),
            })
          : t('chat.add_agent_to_start')}
      </AppText>
      {suggestions.length > 0 && onSuggestionPress ? (
        <View style={{ marginTop: 16, width: '100%' }}>
          {suggestions.map((suggestion) => (
            <ScalePressable
              key={suggestion}
              onPress={() => onSuggestionPress(suggestion)}
              style={styles.suggestionButton}
              accessibilityRole="button"
              accessibilityLabel={suggestion}
            >
              <AppText variant="caption" style={{ color: DESIGN_TOKENS.colors.primary, fontWeight: '700' }}>
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
  card: {
    marginTop: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 52,
    ...DESIGN_TOKENS.shadow,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.text,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: DESIGN_TOKENS.colors.muted,
    textAlign: 'center',
    paddingHorizontal: 14,
  },
  suggestionButton: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${DESIGN_TOKENS.colors.primary}30`,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
});
