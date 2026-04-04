import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

export interface RoomCardProps {
  /** The chat room data to display. */
  room: ChatRoom;
  /** The list of agents in the room. */
  agents: { id: string; name: string }[];
  /** Optional latest message preview */
  lastMessage?: string;
  /** Optional latest message timestamp */
  lastMessageAt?: string;
  /** Whether the room has unread updates */
  unread?: boolean;
  /** Whether the room is pinned */
  pinned?: boolean;
  /** Callback fired when the card is pressed. */
  onPress: () => void;
  /** Callback fired when pin state should toggle */
  onTogglePin?: () => void;
}

/**
 * A card component that displays a chat room's name and its members.
 */
export const RoomCard = React.memo(
  ({
    room,
    agents,
    lastMessage,
    lastMessageAt,
    unread = false,
    pinned = false,
    onPress,
    onTogglePin,
  }: RoomCardProps) => {
  const { t } = useTranslation();
  const initial = room.name[0]?.toUpperCase() ?? '?';
  const rawUpdatedDate = new Date(lastMessageAt ?? room.updated_at);
  const hasValidUpdatedDate = !Number.isNaN(rawUpdatedDate.getTime());
  const updatedLabel = hasValidUpdatedDate
    ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(rawUpdatedDate)
    : '';
  const memberLabel = () => {
    if (agents.length === 0) return t('chat.no_agents_yet', 'No agents yet');
    if (agents.length === 1)
      return t('chat.you_and_one', 'You + {{name}}', { name: agents[0].name });
    if (agents.length === 2)
      return t('chat.you_and_two', 'You, {{name1}} & {{name2}}', {
        name1: agents[0].name,
        name2: agents[1].name,
      });
    return t('chat.you_plus_n_agents', 'You + {{count}} agents', { count: agents.length });
  };

    const preview = (lastMessage?.trim() || t('chat.tap_to_continue', 'Tap to continue'))
      .replace(/\s+/g, ' ');

    return (
      <ScalePressable
        onPress={onPress}
        className="flex-row items-center rounded-[20px] p-[14px] mb-[10px]"
        style={{
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: unread ? `${C.primary}45` : DESIGN_TOKENS.colors.border,
          ...DESIGN_TOKENS.shadow,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${room.name}${unread ? ', unread' : ''}`}
      >
        <View
          className="w-12 h-12 rounded-[14px] items-center justify-center me-[14px]"
          style={{ backgroundColor: C.primarySurface, borderWidth: 1, borderColor: `${C.primary}22` }}
        >
          <AppText className="text-[20px] font-bold" style={{ color: C.primary }}>
            {initial}
          </AppText>
        </View>
        <View className="flex-1 pe-2">
          <View className="flex-row items-center mb-[3px]">
            <AppText className="text-[15px] font-semibold flex-1" style={{ color: C.text }} numberOfLines={1}>
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={14} color={C.primary} /> : null}
          </View>
          <AppText variant="caption" className="text-[12px] mb-[3px]" style={{ color: C.muted }} numberOfLines={2}>
            {preview}
          </AppText>
          <View className="flex-row items-center">
            <Ionicons name="people-outline" size={12} color={C.muted} className="me-1" />
            <AppText variant="caption" className="text-[12px]" style={{ color: C.muted }} numberOfLines={1}>
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View className="items-end">
          {updatedLabel ? (
            <AppText variant="caption" style={{ color: C.muted, marginBottom: 3 }}>
              {updatedLabel}
            </AppText>
          ) : null}
          {unread ? (
            <View
              style={{
                minWidth: 9,
                height: 9,
                borderRadius: 9,
                marginBottom: 6,
                backgroundColor: C.primary,
              }}
            />
          ) : null}
          <View className="flex-row items-center">
            {onTogglePin ? (
              <ScalePressable
                onPress={onTogglePin}
                className="w-7 h-7 rounded-full items-center justify-center me-1"
                style={{ backgroundColor: C.primarySurface }}
                accessibilityRole="button"
                accessibilityLabel={pinned ? 'Unpin chat' : 'Pin chat'}
              >
                <Ionicons name={pinned ? 'bookmark' : 'bookmark-outline'} size={14} color={C.primary} />
              </ScalePressable>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={C.faint} />
          </View>
        </View>
      </ScalePressable>
    );
  }
);

RoomCard.displayName = 'RoomCard';
