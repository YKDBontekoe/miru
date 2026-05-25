import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const C = {
  surface: DESIGN_TOKENS.colors.surface,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
  border: DESIGN_TOKENS.colors.border,
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

    return (
      <ScalePressable
        onPress={onPress}
        style={[
          styles.container,
          unread ? styles.containerUnread : styles.containerRead
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('chat.room_accessibility', {
          defaultValue: '{{name}}{{suffix}}',
          name: room.name,
          suffix: unread ? `, ${t('chat.unread', { defaultValue: 'unread' })}` : '',
        })}
      >
        <View style={styles.avatar}>
          <AppText style={styles.avatarText}>{initial}</AppText>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText style={styles.title} numberOfLines={1}>
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={14} color={C.primary} /> : null}
          </View>
          <AppText variant="caption" style={styles.previewText} numberOfLines={2}>
            {preview}
          </AppText>
          <View style={styles.membersRow}>
            <Ionicons name="people-outline" size={12} color={C.muted} style={styles.membersIcon} />
            <AppText variant="caption" style={styles.membersText} numberOfLines={1}>
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View style={styles.rightColumn}>
          {updatedLabel ? (
            <AppText variant="caption" style={styles.updatedText}>
              {updatedLabel}
            </AppText>
          ) : null}
          {unread ? <View style={styles.unreadDot} /> : null}
          <View style={styles.actionsRow}>
            {onTogglePin ? (
              <ScalePressable
                onPress={onTogglePin}
                style={styles.pinButton}
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
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.bubblePaddingV,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderWidth: 1,
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.sm,
    }),
  },
  containerRead: {
    borderColor: DESIGN_TOKENS.colors.border,
  },
  containerUnread: {
    borderColor: `${DESIGN_TOKENS.colors.primary}73`, // Primary color with 45% opacity
  },
  avatar: {
    width: theme.spacing.massive,
    height: theme.spacing.massive,
    borderRadius: theme.spacing.bubblePaddingH,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.bubblePaddingH,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderWidth: 1,
    borderColor: `${DESIGN_TOKENS.colors.primary}38`, // Primary color with 22% opacity
  },
  avatarText: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: 'bold',
    color: DESIGN_TOKENS.colors.primary,
  },
  content: {
    flex: 1,
    paddingEnd: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 3,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    color: DESIGN_TOKENS.colors.text,
  },
  previewText: {
    fontSize: theme.typography.caption.fontSize,
    marginBottom: 3,
    color: DESIGN_TOKENS.colors.muted,
  },
  membersRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  membersIcon: {
    marginEnd: theme.spacing.xs,
  },
  membersText: {
    fontSize: theme.typography.caption.fontSize,
    color: DESIGN_TOKENS.colors.muted,
  },
  rightColumn: {
    alignItems: 'flex-end',
  },
  updatedText: {
    color: DESIGN_TOKENS.colors.muted,
    marginBottom: 3,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: theme.borderRadius.full,
    marginBottom: 6,
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinButton: {
    width: theme.spacing.avatar,
    height: theme.spacing.avatar,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.xs,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
  },
});
