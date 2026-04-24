import React from 'react';
import { View, StyleSheet } from 'react-native';
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

    const dynamicStyles = React.useMemo(() => StyleSheet.create({
      card: {
        backgroundColor: C.surface,
        borderColor: unread ? `${C.primary}73` : C.border,
      },
      avatar: {
        backgroundColor: C.primarySurface,
        borderColor: `${C.primary}38`,
      },
      avatarText: {
        color: C.primary,
      },
      title: {
        color: C.text,
      },
      previewText: {
        color: C.subtext,
      },
      memberText: {
        color: C.subtext,
      },
      updatedLabel: {
        color: C.subtext,
      },
      unreadDot: {
        backgroundColor: C.primary,
      },
      pinButton: {
        backgroundColor: C.primarySurface,
      },
    }), [C, unread]);

    return (
      <ScalePressable
        onPress={onPress}
        style={[styles.card, dynamicStyles.card, theme.elevation.md]}
        accessibilityRole="button"
        accessibilityLabel={t('chat.room_accessibility', {
          defaultValue: '{{name}}{{suffix}}',
          name: room.name,
          suffix: unread ? `, ${t('chat.unread', { defaultValue: 'unread' })}` : '',
        })}
      >
        <View style={[styles.avatar, dynamicStyles.avatar]}>
          <AppText style={[styles.avatarText, dynamicStyles.avatarText]}>{initial}</AppText>
        </View>
        <View style={styles.content}>
          <View style={styles.titleRow}>
            <AppText style={[styles.title, dynamicStyles.title]} numberOfLines={1}>
              {room.name}
            </AppText>
            {pinned ? <Ionicons name="bookmark" size={14} color={C.primary} /> : null}
          </View>
          <AppText variant="caption" style={[styles.previewText, dynamicStyles.previewText]} numberOfLines={2}>
            {preview}
          </AppText>
          <View style={styles.memberRow}>
            <Ionicons name="people-outline" size={12} color={C.muted} style={styles.memberIcon} />
            <AppText variant="caption" style={[styles.memberText, dynamicStyles.memberText]} numberOfLines={1}>
              {memberLabel()}
            </AppText>
          </View>
        </View>
        <View style={styles.rightContent}>
          {updatedLabel ? (
            <AppText variant="caption" style={[styles.updatedLabel, dynamicStyles.updatedLabel]}>
              {updatedLabel}
            </AppText>
          ) : null}
          {unread ? <View style={[styles.unreadDot, dynamicStyles.unreadDot]} /> : null}
          <View style={styles.actionRow}>
            {onTogglePin ? (
              <ScalePressable
                onPress={onTogglePin}
                style={[styles.pinButton, dynamicStyles.pinButton]}
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

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md + 2,
    marginBottom: theme.spacing.md - 2,
    borderWidth: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md + 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md + 2,
    borderWidth: 1,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingEnd: theme.spacing.sm,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.xs - 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  previewText: {
    fontSize: 12,
    marginBottom: theme.spacing.xs - 1,
  },
  memberRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  memberIcon: {
    marginEnd: theme.spacing.xxs,
  },
  memberText: {
    fontSize: 12,
  },
  rightContent: {
    alignItems: 'flex-end',
  },
  updatedLabel: {
    marginBottom: theme.spacing.xs - 1,
  },
  unreadDot: {
    width: 9,
    height: 9,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.sm - 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pinButton: {
    width: 28,
    height: 28,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.xs,
  },
});

RoomCard.displayName = 'RoomCard';
