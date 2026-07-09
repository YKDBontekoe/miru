import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';

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
      className="mt-2.5 rounded-3xl items-center justify-center px-6 py-[52px] shadow-md"
      style={{ borderWidth: 1, borderColor: C.border, backgroundColor: C.surface }}
    >
      <View
        className="w-[72px] h-[72px] rounded-3xl items-center justify-center mb-3.5"
        style={{ backgroundColor: C.primarySurface }}
      >
        <Ionicons name="chatbubble-ellipses-outline" size={34} color={C.primary} />
      </View>
      <AppText className="text-[20px] leading-[26px] font-bold mb-1.5" style={{ color: C.text }}>
        {t('chat.start_conversation')}
      </AppText>
      <AppText className="text-sm leading-5 text-center px-3.5" style={{ color: C.muted }}>
        {roomAgents.length > 0
          ? t('chat.room_agents_status', {
              count: roomAgents.length,
              names: roomAgents.map((a) => a.name).join(', '),
            })
          : t('chat.add_agent_to_start')}
      </AppText>
      {suggestions.length > 0 && onSuggestionPress ? (
        <View className="mt-4 w-full">
          {suggestions.map((suggestion, index) => (
            <ScalePressable
              key={`${suggestion}-${index}`}
              onPress={() => onSuggestionPress(suggestion)}
              className="rounded-xl px-2.5 py-2 mb-2"
              style={{ borderWidth: 1, borderColor: `${C.primary}4D`, backgroundColor: C.primarySurface }}
              accessibilityRole="button"
              accessibilityLabel={suggestion}
            >
              <AppText variant="caption" className="font-bold" style={{ color: C.primary }}>
                {suggestion}
              </AppText>
            </ScalePressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};
