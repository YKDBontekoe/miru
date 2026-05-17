import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { DESIGN_TOKENS, OPACITY } from '@/core/design/tokens';
import { theme } from '@/core/theme';

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
      if (agents.length === 1) {
        return t('chat.you_and_one', 'You + {{name}}', { name: agents[0].name });
      }
      if (agents.length === 2) {
        return t('chat.you_and_two', 'You, {{name1}} & {{name2}}', {
          name1: agents[0].name,
          name2: agents[1].name,
        });
      }
      return t('chat.you_plus_n_agents', 'You + {{count}} agents', { count: agents.length });
    };

    const preview = (lastMessage?.trim() || t('chat.tap_to_continue', 'Tap to continue')).replace(
      /\s+/g,
      ' '
    );
    const cardBorderClass = unread ? 'border-[#147D6473]' : 'border-[#DDE8E0]';

    return (
      <ScalePressable
        onPress={onPress}
        className={`flex-row items-center rounded-[20px] p-[14px] mb-[10px] bg-white border shadow-md ${cardBorderClass}`}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          borderRadius: DESIGN_TOKENS.radius.lg,
          padding: theme.spacing.bubblePaddingH,
          marginBottom: theme.spacing.bubblePaddingV,
          backgroundColor: DESIGN_TOKENS.colors.white,
          borderWidth: 1,
          borderColor: unread ? `${DESIGN_TOKENS.colors.primary}${OPACITY.primaryBorder}` : DESIGN_TOKENS.colors.border,
          ...DESIGN_TOKENS.shadow,
        }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.room_accessibility', {
          defaultValue: '{{name}}{{suffix}}',
          name: room.name,
          suffix: unread ? `, ${t('chat.unread', { defaultValue: 'unread' })}` : '',
        })}
      >
        <View
          className="w-12 h-12 rounded-[14px] items-center justify-center me-[14px] bg-[#DDF4EB] border border-[#147D6438]"
          style={{
            width: theme.spacing.massive,
            height: theme.spacing.massive,
            borderRadius: DESIGN_TOKENS.radius.sm,
            alignItems: 'center',
            justifyContent: 'center',
            marginEnd: theme.spacing.bubblePaddingH,
            backgroundColor: DESIGN_TOKENS.colors.primarySoft,
            borderWidth: 1,
            borderColor: `${DESIGN_TOKENS.colors.primary}38`,
          }}
        >
          <AppText
            className="text-[20px] font-bold text-[#147D64]"
            style={{
              ...theme.typography.h3,
              fontWeight: '700',
              color: DESIGN_TOKENS.colors.primary,
            }}
          >
            {initial}
          </AppText>
        </View>
        <View
          className="flex-1 pe-2"
          style={{
            flex: 1,
            paddingEnd: theme.spacing.sm,
          }}
        >
          <View
            className="flex-row items-center mb-[3px]"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              marginBottom: theme.spacing.xs,
            }}
          >
            <AppText
              className="text-[15px] font-semibold flex-1 text-[#13251C]"
              numberOfLines={1}
              style={{
                ...theme.typography.bodySm,
                fontWeight: '600',
                flex: 1,
                color: DESIGN_TOKENS.colors.text,
              }}
            >
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={theme.spacing.bubblePaddingH} color={DESIGN_TOKENS.colors.primary} /> : null}
          </View>
          <AppText
            variant="caption"
            className="text-[12px] mb-[3px] text-[#5A7467]"
            numberOfLines={2}
            style={{
              ...theme.typography.caption,
              marginBottom: theme.spacing.xs,
              color: DESIGN_TOKENS.colors.muted,
            }}
          >
            {preview}
          </AppText>
          <View
            className="flex-row items-center"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            <Ionicons
              name="people-outline"
              size={theme.spacing.md}
              color={DESIGN_TOKENS.colors.muted}
              className="me-1"
              style={{ marginEnd: theme.spacing.xs }}
            />
            <AppText
              variant="caption"
              className="text-[12px] text-[#5A7467]"
              numberOfLines={1}
              style={{
                ...theme.typography.caption,
                color: DESIGN_TOKENS.colors.muted,
              }}
            >
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View
          className="items-end"
          style={{
            alignItems: 'flex-end',
          }}
        >
          {updatedLabel ? (
            <AppText
              variant="caption"
              className="text-[#5A7467] mb-[3px]"
              style={{
                ...theme.typography.caption,
                color: DESIGN_TOKENS.colors.muted,
                marginBottom: theme.spacing.xs,
              }}
            >
              {updatedLabel}
            </AppText>
          ) : null}
          {unread ? (
            <View
              className="w-[9px] h-[9px] rounded-full mb-1.5 bg-[#147D64]"
              style={{
                width: theme.spacing.sm + 1,
                height: theme.spacing.sm + 1,
                borderRadius: DESIGN_TOKENS.radius.full,
                marginBottom: theme.spacing.sm - 2,
                backgroundColor: DESIGN_TOKENS.colors.primary,
              }}
            />
          ) : null}
          <View
            className="flex-row items-center"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
            }}
          >
            {onTogglePin ? (
              <ScalePressable
                onPress={onTogglePin}
                className="w-7 h-7 rounded-full items-center justify-center me-1 bg-[#DDF4EB]"
                style={{
                  width: theme.spacing.avatar,
                  height: theme.spacing.avatar,
                  borderRadius: DESIGN_TOKENS.radius.full,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginEnd: theme.spacing.xs,
                  backgroundColor: DESIGN_TOKENS.colors.primarySoft,
                }}
                accessibilityRole="button"
                accessibilityLabel={
                  pinned
                    ? t('chat.unpin', { defaultValue: 'Unpin chat' })
                    : t('chat.pin', { defaultValue: 'Pin chat' })
                }
              >
                <Ionicons
                  name={pinned ? 'bookmark' : 'bookmark-outline'}
                  size={theme.spacing.bubblePaddingH}
                  color={DESIGN_TOKENS.colors.primary}
                />
              </ScalePressable>
            ) : null}
            <Ionicons name="chevron-forward" size={theme.spacing.md} color={DESIGN_TOKENS.colors.faint} />
          </View>
        </View>
      </ScalePressable>
    );
  }
);

RoomCard.displayName = 'RoomCard';
