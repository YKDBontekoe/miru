import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
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
        <View style={styles.avatarContainer}>
          <AppText style={styles.avatarText}>{initial}</AppText>
        </View>
        <View style={styles.contentContainer}>
          <View style={styles.headerRow}>
            <AppText style={styles.title} numberOfLines={1}>
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={theme.spacing.bubblePaddingH} color={DESIGN_TOKENS.colors.primary} /> : null}
          </View>
          <AppText variant="caption" style={styles.previewText} numberOfLines={2}>
            {preview}
          </AppText>
          <View style={styles.membersRow}>
            <Ionicons name="people-outline" size={theme.spacing.md} color={DESIGN_TOKENS.colors.muted} style={styles.membersIcon} />
            <AppText variant="caption" style={styles.membersText} numberOfLines={1}>
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View style={styles.trailingContainer}>
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
                  size={theme.spacing.bubblePaddingH}
                  color={DESIGN_TOKENS.colors.primary}
                />
              </ScalePressable>
            ) : null}
            <Ionicons name="chevron-forward" size={18} color={DESIGN_TOKENS.colors.faint} />
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
    borderRadius: DESIGN_TOKENS.radius.lg,
    padding: theme.spacing.bubblePaddingH,
    marginBottom: theme.spacing.bubblePaddingV,
    backgroundColor: DESIGN_TOKENS.colors.white,
    borderWidth: 1,
    ...DESIGN_TOKENS.shadow,
  },
  containerUnread: {
    borderColor: `${DESIGN_TOKENS.colors.primary}73`,
  },
  containerRead: {
    borderColor: DESIGN_TOKENS.colors.border,
  },
  avatarContainer: {
    width: theme.spacing.massive,
    height: theme.spacing.massive,
    borderRadius: DESIGN_TOKENS.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.bubblePaddingH,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderWidth: 1,
    borderColor: `${DESIGN_TOKENS.colors.primary}38`,
  },
  avatarText: {
    ...theme.typography.h3,
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.primary,
  },
  contentContainer: {
    flex: 1,
    paddingEnd: theme.spacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs,
  },
  title: {
    ...theme.typography.bodySm,
    fontWeight: '600',
    flex: 1,
    color: DESIGN_TOKENS.colors.text,
  },
  previewText: {
    ...theme.typography.caption,
    marginBottom: theme.spacing.xs,
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
    ...theme.typography.caption,
    color: DESIGN_TOKENS.colors.muted,
  },
  trailingContainer: {
    alignItems: 'flex-end',
  },
  updatedText: {
    ...theme.typography.caption,
    color: DESIGN_TOKENS.colors.muted,
    marginBottom: theme.spacing.xs,
  },
  unreadDot: {
    width: theme.spacing.sm + 1,
    height: theme.spacing.sm + 1,
    borderRadius: DESIGN_TOKENS.radius.full,
    marginBottom: theme.spacing.sm - 2,
    backgroundColor: DESIGN_TOKENS.colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinButton: {
    width: theme.spacing.avatar,
    height: theme.spacing.avatar,
    borderRadius: DESIGN_TOKENS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.xs,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
  },
});
