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
    if (agents.length === 1) return `You + ${agents[0].name}`;
    if (agents.length === 2) return `You, ${agents[0].name} & ${agents[1].name}`;
    return `You + ${agents.length} agents`;
  };

  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 20,
        padding: 14,
        marginBottom: 10,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 14,
        elevation: 2,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 14,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 20, fontWeight: '700' }}>{initial}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 }}>
          {room.name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="people-outline" size={12} color={C.muted} style={{ marginEnd: 4 }} />
          <AppText variant="caption" style={{ fontSize: 12, color: C.muted }}>
            {memberLabel()}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </ScalePressable>
  );
});

RoomCard.displayName = 'RoomCard';
