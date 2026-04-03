import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom, Agent } from '@/core/models';

const C = {
  surface: '#FFFFFF',
  text: '#0A0E2E',
  muted: '#606490',
  faint: '#B4BBDE',
  primary: '#2563EB',
  primarySurface: '#EEF4FF',
};

export interface RoomCardProps {
  /** The chat room data to display. */
  room: ChatRoom;
  /** The list of agents in the room. */
  agents: Agent[];
  /** Callback fired when the card is pressed. */
  onPress: () => void;
}

/**
 * A card component that displays a chat room's name and its members.
 */
export const RoomCard = React.memo(({ room, agents, onPress }: RoomCardProps) => {
  const { t } = useTranslation();
  const initial = room.name[0]?.toUpperCase() ?? '?';
  const memberLabel = () => {
    if (agents.length === 0) return t('chat.no_agents_yet', 'No agents yet');
    if (agents.length === 1) return t('chat.you_and_one', 'You + {{name}}', { name: agents[0].name });
    if (agents.length === 2) return t('chat.you_and_two', 'You, {{name1}} & {{name2}}', { name1: agents[0].name, name2: agents[1].name });
    return t('chat.you_plus_n_agents', 'You + {{count}} agents', { count: agents.length });
  };

  return (
    <ScalePressable
      onPress={onPress}
      className="flex-row items-center rounded-[20px] p-[14px] mb-[10px] shadow-sm shadow-blue-600/[0.06]"
      style={{
        backgroundColor: C.surface,
        elevation: 2,
      }}
    >
      <View
        className="w-12 h-12 rounded-[14px] items-center justify-center me-[14px]"
        style={{ backgroundColor: C.primarySurface }}
      >
        <AppText className="text-[20px] font-bold" style={{ color: C.primary }}>
          {initial}
        </AppText>
      </View>
      <View className="flex-1">
        <AppText className="text-[15px] font-semibold mb-[3px]" style={{ color: C.text }}>
          {room.name}
        </AppText>
        <View className="flex-row items-center">
          <Ionicons name="people-outline" size={12} color={C.muted} className="me-1" />
          <AppText variant="caption" className="text-[12px]" style={{ color: C.muted }}>
            {memberLabel()}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </ScalePressable>
  );
});

RoomCard.displayName = 'RoomCard';
