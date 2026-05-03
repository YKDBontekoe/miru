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
const listStyles = StyleSheet.create({
  cardContainer: {
    borderRadius: 20,
    marginBottom: theme.spacing.md,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
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
  },
  moodText: {
    fontSize: theme.typography.caption.fontSize + 1,
  },
  personalityText: {
    ...theme.typography.caption,
    lineHeight: theme.typography.caption.fontSize * 1.4,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    marginTop: theme.spacing.sm,
  },
  levelBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  progressBarContainer: {
    flex: 1,
    height: 3,
    borderRadius: theme.borderRadius.xs,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 3,
    borderRadius: theme.borderRadius.xs,
  },
  rightContainer: {
    alignItems: 'flex-end',
    marginStart: theme.spacing.sm,
  },
  messageCountText: {
    fontSize: 10,
    marginBottom: theme.spacing.sm,
  },
});

export const AgentCard: React.FC<AgentCardProps> = React.memo(({
  item,
  index,
  onPress,
  onLongPress,
  isPinned,
}) => {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;
  const xpProgress = (item.message_count % 10) / 10;

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View style={[listStyles.cardContainer, { backgroundColor: C.surface }]}>
          <View style={listStyles.innerContainer}>
            <AgentAvatar name={item.name} size={48} color={color} />
            <View style={listStyles.contentContainer}>
              <View style={listStyles.headerRow}>
                <AppText style={[listStyles.nameText, { color: C.text }]}>{item.name}</AppText>
                {item.mood && item.mood !== 'Neutral' && (
                  <AppText style={listStyles.moodText}>{getMoodEmoji(item.mood)}</AppText>
                )}
                {isPinned && <Ionicons name="star" size={11} color={theme.colors.status.warning} />}
              </View>
              <AppText style={[listStyles.personalityText, { color: C.muted }]} numberOfLines={1}>
                {item.personality}
              </AppText>
              <View style={listStyles.progressRow}>
                <View style={[listStyles.levelBadge, { backgroundColor: `${color}15` }]}>
                  <AppText style={[listStyles.levelText, { color }]}>Lv {level}</AppText>
                </View>
                <View style={[listStyles.progressBarContainer, { backgroundColor: `${color}18` }]}>
                  <View style={[listStyles.progressBarFill, { width: `${Math.min(Math.max(xpProgress * 100, 0), 100)}%`, backgroundColor: `${color}70` }]} />
                </View>
              </View>
            </View>
            <View style={listStyles.rightContainer}>
              <AppText style={[listStyles.messageCountText, { color: C.faint }]}>{item.message_count} msgs</AppText>
              <Ionicons name="chevron-forward" size={14} color={C.faint} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
});

AgentCard.displayName = 'AgentCard';

const gridStyles = StyleSheet.create({
  wrapper: {
    flex: 1,
    maxWidth: '50%',
  },
  cardContainer: {
    borderRadius: 20,
    margin: theme.spacing.xs,
    padding: theme.spacing.lg,
    alignItems: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 2,
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
  },
  nameText: {
    ...theme.typography.bodySm,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: theme.spacing.xxs,
  },
  moodText: {
    fontSize: theme.typography.caption.fontSize,
    marginBottom: theme.spacing.sm,
  },
  levelBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xxs,
    marginBottom: theme.spacing.sm,
  },
  levelText: {
    fontSize: 10,
    fontWeight: '700',
  },
  personalityText: {
    fontSize: 11,
    textAlign: 'center',
  },
});

/**
 * AgentGridCard Component
 * Displays an agent item as a grid tile with centered alignment.
 * Refactored to utilize global design tokens and a modular stylesheet structure.
 *
 * @param {AgentCardProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered grid tile card.
 */
export const AgentGridCard: React.FC<AgentCardProps> = React.memo(({
  item,
  index,
  onPress,
  onLongPress,
  isPinned,
}) => {
  const { C } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(300)} style={gridStyles.wrapper}>
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View style={[gridStyles.cardContainer, { backgroundColor: C.surface }]}>
          <View style={gridStyles.avatarWrapper}>
            <AgentAvatar name={item.name} size={56} color={color} />
            {isPinned && (
              <View style={[gridStyles.pinBadge, { borderColor: C.surface }]}>
                <Ionicons name="star" size={8} color="white" />
              </View>
            )}
          </View>
          <AppText style={[gridStyles.nameText, { color: C.text }]} numberOfLines={1}>
            {item.name}
          </AppText>
          {item.mood && item.mood !== 'Neutral' && (
            <AppText style={gridStyles.moodText}>{getMoodEmoji(item.mood)}</AppText>
          )}
          <View style={[gridStyles.levelBadge, { backgroundColor: `${color}18` }]}>
            <AppText style={[gridStyles.levelText, { color }]}>Lv {level}</AppText>
          </View>
          <AppText style={[gridStyles.personalityText, { color: C.muted }]} numberOfLines={2}>
            {item.personality}
          </AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
});

AgentGridCard.displayName = 'AgentGridCard';
