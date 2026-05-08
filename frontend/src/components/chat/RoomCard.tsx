import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { useTheme } from '@/hooks/useTheme';
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
    const { C } = useTheme();
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
    const cardBorderColor = unread ? `${C.primary}73` : C.border;

    return (
      <ScalePressable
        onPress={onPress}
        style={[styles.card, { borderColor: cardBorderColor, backgroundColor: C.surface }]}
        accessibilityRole="button"
        accessibilityLabel={t('chat.room_accessibility', {
          defaultValue: '{{name}}{{suffix}}',
          name: room.name,
          suffix: unread ? `, ${t('chat.unread', { defaultValue: 'unread' })}` : '',
        })}
      >
        <View style={[styles.avatar, { backgroundColor: C.primarySurface, borderColor: `${C.primary}38` }]}>
          <AppText style={[styles.avatarText, { color: C.primary }]}>{initial}</AppText>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText style={[styles.title, { color: C.text }]} numberOfLines={1}>
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={14} color={C.primary} style={styles.pinIcon} /> : null}
          </View>
          <AppText variant="caption" style={[styles.preview, { color: C.muted }]} numberOfLines={2}>
            {preview}
          </AppText>
          <View style={styles.membersRow}>
            <Ionicons name="people-outline" size={12} color={C.muted} style={styles.membersIcon} />
            <AppText variant="caption" style={[styles.membersText, { color: C.muted }]} numberOfLines={1}>
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View style={styles.meta}>
          {updatedLabel ? (
            <AppText variant="caption" style={[styles.timestamp, { color: C.muted }]}>
              {updatedLabel}
            </AppText>
          ) : null}
          {unread ? <View style={[styles.unreadDot, { backgroundColor: C.primary }]} /> : null}
          <View style={styles.actionsRow}>
            {onTogglePin ? (
              <ScalePressable
                onPress={onTogglePin}
                style={[styles.pinAction, { backgroundColor: C.primarySurface }]}
                accessibilityRole="button"
                accessibilityLabel={
                  pinned
                    ? t('chat.unpin', { defaultValue: 'Unpin chat' })
                    : t('chat.pin', { defaultValue: 'Pin chat' })
                }
              >
                <Ionicons
                  name={pinned ? 'bookmark' : 'bookmark-outline'}
                  size={14}
                  color={C.primary}
                />
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: 14,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    ...(Platform.OS === 'ios' ? theme.elevation.md : {
      elevation: theme.elevation.md.elevation,
      shadowColor: 'transparent',
    }),
  },
  avatar: {
    width: theme.spacing.massive,
    height: theme.spacing.massive,
    borderRadius: theme.borderRadius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md - 2,
    borderWidth: 1,
  },
  avatarText: {
    ...theme.typography.h3,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingEnd: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xxs + 1,
  },
  title: {
    ...theme.typography.body,
    fontWeight: '600',
    flex: 1,
  },
  pinIcon: {
    marginStart: theme.spacing.xs,
  },
  preview: {
    marginBottom: theme.spacing.xxs + 1,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersIcon: {
    marginEnd: theme.spacing.xs,
  },
  membersText: {
    flex: 1,
  },
  meta: {
    alignItems: 'flex-end',
  },
  timestamp: {
    marginBottom: theme.spacing.xxs + 1,
  },
  unreadDot: {
    width: theme.spacing.sm + 1,
    height: theme.spacing.sm + 1,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xs + 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinAction: {
    width: theme.spacing.avatar,
    height: theme.spacing.avatar,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.xs,
  },
});
