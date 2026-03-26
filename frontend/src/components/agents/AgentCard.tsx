import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { AppText } from '../AppText';
import { AgentAvatar } from '../AgentAvatar';
import { ScalePressable } from '../ScalePressable';
import { useTheme } from '../../hooks/useTheme';
import { theme } from '../../core/theme';
import { Agent } from '../../core/models';
import { getAgentColor, getMoodEmoji } from './agentUtils';

export interface AgentCardProps {
  item: Agent;
  index: number;
  onPress: () => void;
  onLongPress: () => void;
  isPinned: boolean;
}

/**
 * AgentCard Component
 * Displays an individual agent item in a vertical list, including their avatar, mood, level, and xp progress.
 * Adheres to the Premium Standard by utilizing theme tokens for colors, typography, spacing, and using RTL-compatible paddings.
 *
 * @param {AgentCardProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered list item card.
 */
export function AgentCard({ item, index, onPress, onLongPress, isPinned }: AgentCardProps) {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;
  const xpProgress = (item.message_count % 10) / 10;

  const styles = StyleSheet.create({
    cardContainer: {
      backgroundColor: C.surface,
      borderRadius: theme.borderRadius.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: C.border,
      borderStartWidth: 3,
      borderStartColor: color,
      overflow: 'hidden',
    },
    innerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: theme.spacing.md,
      paddingEnd: theme.spacing.md,
      paddingStart: theme.spacing.lg,
    },
    contentContainer: {
      flex: 1,
      marginStart: theme.spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginBottom: theme.spacing.xxs,
    },
    nameText: {
      ...theme.typography.body,
      fontWeight: '700',
      color: C.text,
    },
    moodText: {
      fontSize: theme.typography.caption.fontSize + 1,
    },
    personalityText: {
      ...theme.typography.caption,
      color: C.muted,
      lineHeight: theme.typography.caption.fontSize * 1.4,
    },
    progressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: theme.spacing.sm,
      marginTop: theme.spacing.sm,
    },
    levelBadge: {
      backgroundColor: `${color}18`,
      borderRadius: theme.borderRadius.xs,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: 1,
    },
    levelText: {
      color,
      fontSize: 10,
      fontWeight: '700',
    },
    progressBarContainer: {
      flex: 1,
      height: 3,
      backgroundColor: `${color}18`,
      borderRadius: theme.borderRadius.xs,
      overflow: 'hidden',
    },
    progressBarFill: {
      width: `${Math.min(Math.max(xpProgress * 100, 0), 100)}%`,
      height: 3,
      backgroundColor: `${color}70`,
      borderRadius: theme.borderRadius.xs,
    },
    rightContainer: {
      alignItems: 'flex-end',
      marginStart: theme.spacing.sm,
    },
    messageCountText: {
      color: C.faint,
      fontSize: 10,
      marginBottom: theme.spacing.sm,
    },
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50)
        .springify()
        .damping(20)}
    >
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.cardContainer}>
          <View style={styles.innerContainer}>
            <AgentAvatar name={item.name} size={48} color={color} />
            <View style={styles.contentContainer}>
              <View style={styles.headerRow}>
                <AppText style={styles.nameText}>{item.name}</AppText>
                {item.mood && item.mood !== 'Neutral' && (
                  <AppText style={styles.moodText}>{getMoodEmoji(item.mood)}</AppText>
                )}
                {isPinned && <Ionicons name="star" size={11} color={theme.colors.status.warning} />}
              </View>
              <AppText style={styles.personalityText} numberOfLines={1}>
                {item.personality}
              </AppText>
              <View style={styles.progressRow}>
                <View style={styles.levelBadge}>
                  <AppText style={styles.levelText}>Lv {level}</AppText>
                </View>
                <View style={styles.progressBarContainer}>
                  <View style={styles.progressBarFill} />
                </View>
              </View>
            </View>
            <View style={styles.rightContainer}>
              <AppText style={styles.messageCountText}>{item.message_count} msgs</AppText>
              <Ionicons name="chevron-forward" size={14} color={C.faint} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

/**
 * AgentGridCard Component
 * Displays an agent item as a grid tile with centered alignment.
 * Refactored to utilize global design tokens and a modular stylesheet structure.
 *
 * @param {AgentCardProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered grid tile card.
 */
export function AgentGridCard({ item, index, onPress, onLongPress, isPinned }: AgentCardProps) {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;

  const styles = StyleSheet.create({
    wrapper: {
      flex: 1,
      maxWidth: '50%',
    },
    cardContainer: {
      backgroundColor: C.surface,
      borderRadius: theme.borderRadius.lg,
      margin: theme.spacing.xs,
      borderWidth: 1,
      borderColor: C.border,
      padding: theme.spacing.lg,
      alignItems: 'center',
    },
    avatarWrapper: {
      position: 'relative',
      marginBottom: theme.spacing.md,
    },
    pinBadge: {
      position: 'absolute',
      top: -3,
      right: -3,
      backgroundColor: theme.colors.status.warning,
      width: 16,
      height: 16,
      borderRadius: theme.borderRadius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
      borderColor: C.surface,
    },
    nameText: {
      ...theme.typography.bodySm,
      fontWeight: '700',
      color: C.text,
      textAlign: 'center',
      marginBottom: theme.spacing.xxs,
    },
    moodText: {
      fontSize: theme.typography.caption.fontSize,
      marginBottom: theme.spacing.sm,
    },
    levelBadge: {
      backgroundColor: `${color}18`,
      borderRadius: theme.borderRadius.sm,
      paddingHorizontal: theme.spacing.sm,
      paddingVertical: theme.spacing.xxs,
      marginBottom: theme.spacing.sm,
    },
    levelText: {
      color,
      fontSize: 10,
      fontWeight: '700',
    },
    personalityText: {
      color: C.muted,
      fontSize: 11,
      textAlign: 'center',
    },
  });

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 45)
        .springify()
        .damping(20)}
      style={styles.wrapper}
    >
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View style={styles.cardContainer}>
          <View style={styles.avatarWrapper}>
            <AgentAvatar name={item.name} size={56} color={color} />
            {isPinned && (
              <View style={styles.pinBadge}>
                <Ionicons name="star" size={8} color="white" />
              </View>
            )}
          </View>
          <AppText style={styles.nameText} numberOfLines={1}>
            {item.name}
          </AppText>
          {item.mood && item.mood !== 'Neutral' && (
            <AppText style={styles.moodText}>{getMoodEmoji(item.mood)}</AppText>
          )}
          <View style={styles.levelBadge}>
            <AppText style={styles.levelText}>Lv {level}</AppText>
          </View>
          <AppText style={styles.personalityText} numberOfLines={2}>
            {item.personality}
          </AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}
