import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';

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
    <View className="mt-2.5 rounded-3xl border border-[#DDE8E0] bg-white items-center justify-center px-6 py-[52px] shadow-md">
      <View className="w-[72px] h-[72px] rounded-3xl bg-[#DDF4EB] items-center justify-center mb-3.5">
        <Ionicons name="chatbubble-ellipses-outline" size={34} color="#147D64" />
      </View>
      <AppText className="text-[20px] leading-[26px] font-bold text-[#13251C] mb-1.5">
        {t('chat.start_conversation')}
      </AppText>
      <AppText className="text-sm leading-5 text-[#5A7467] text-center px-3.5">
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
              className="rounded-xl border border-[#147D644D] bg-[#DDF4EB] px-2.5 py-2 mb-2"
              accessibilityRole="button"
              accessibilityLabel={suggestion}
            >
              <AppText variant="caption" className="text-[#147D64] font-bold">
                {suggestion}
              </AppText>
            </ScalePressable>
          ))}
        </View>
      ) : null}
    </View>
  );
};
