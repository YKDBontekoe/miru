import React from 'react';
import { View } from 'react-native';
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
export const AgentCard: React.FC<AgentCardProps> = ({
  item,
  index,
  onPress,
  onLongPress,
  isPinned,
}) => {
  const { C, isDark } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;
  const xpProgress = (item.message_count % 10) / 10;

  const surfaceClass = isDark ? 'bg-surface-dark' : 'bg-surface-light';
  const textClass = isDark ? 'text-onSurface-dark' : 'text-onSurface-light';
  const mutedClass = isDark ? 'text-onSurface-mutedDark' : 'text-onSurface-mutedLight';
  const faintClass = isDark ? 'text-onSurface-disabledDark' : 'text-onSurface-disabledLight';

  return (
    <Animated.View entering={FadeInDown.delay(index * 50).duration(300)}>
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View className={`${surfaceClass} rounded-xl mb-md shadow-sm shadow-primary`}>
          <View className="flex-row items-center py-md pr-md pl-lg">
            <AgentAvatar name={item.name} size={theme.spacing.massive} color={color} />
            <View className="flex-1 ml-md">
              <View className="flex-row items-center gap-sm mb-xxs">
                <AppText className={`${textClass} text-base font-bold`}>{item.name}</AppText>
                {item.mood && item.mood !== 'Neutral' && (
                  <AppText className="text-[13px]">{getMoodEmoji(item.mood)}</AppText>
                )}
                {isPinned && <Ionicons name="star" size={theme.spacing.md} color={theme.colors.status.warning} />}
              </View>
              <AppText className={`${mutedClass} text-xs leading-[17px]`} numberOfLines={1}>
                {item.personality}
              </AppText>
              <View className="flex-row items-center gap-sm mt-sm">
                <View
                  className="rounded-sm px-sm py-xxs"
                  style={{ backgroundColor: `${color}15` }}
                >
                  <AppText style={{ color }} className="text-[10px] font-bold">Lv {level}</AppText>
                </View>
                <View className="flex-1 h-[3px] rounded-xs overflow-hidden" style={{ backgroundColor: `${color}18` }}>
                  <View
                    className="h-[3px] rounded-xs"
                    style={{
                      width: `${Math.min(Math.max(xpProgress * 100, 0), 100)}%`,
                      backgroundColor: `${color}70`
                    }}
                  />
                </View>
              </View>
            </View>
            <View className="items-end ml-sm">
              <AppText className={`${faintClass} text-[10px] mb-sm`}>{item.message_count} msgs</AppText>
              <Ionicons name="chevron-forward" size={14} color={C.faint} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
};

/**
 * AgentGridCard Component
 * Displays an agent item as a grid tile with centered alignment.
 * Refactored to utilize global design tokens and a modular stylesheet structure.
 *
 * @param {AgentCardProps} props - The properties for the component.
 * @returns {JSX.Element} The rendered grid tile card.
 */
export const AgentGridCard: React.FC<AgentCardProps> = ({
  item,
  index,
  onPress,
  onLongPress,
  isPinned,
}) => {
  const { isDark } = useTheme();
  const color = getAgentColor(item.name);
  const level = Math.floor(item.message_count / 10) + 1;

  const surfaceClass = isDark ? 'bg-surface-dark' : 'bg-surface-light';
  const textClass = isDark ? 'text-onSurface-dark' : 'text-onSurface-light';
  const mutedClass = isDark ? 'text-onSurface-mutedDark' : 'text-onSurface-mutedLight';
  const borderSurface = isDark ? 'border-surface-dark' : 'border-surface-light';

  return (
    <Animated.View entering={FadeInDown.delay(index * 45).duration(300)} className="flex-1 max-w-[50%]">
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View className={`${surfaceClass} rounded-xl m-xs p-lg items-center shadow-sm shadow-primary`}>
          <View className="relative mb-md">
            <AgentAvatar name={item.name} size={theme.spacing.bubbleIndent} color={color} />
            {isPinned && (
              <View className={`absolute -top-xxs -right-xxs bg-status-warning w-lg h-lg rounded-sm items-center justify-center border-[1.5px] ${borderSurface}`}>
                <Ionicons name="star" size={theme.spacing.sm} color={theme.colors.white} />
              </View>
            )}
          </View>
          <AppText className={`${textClass} text-sm font-bold text-center mb-xxs`} numberOfLines={1}>
            {item.name}
          </AppText>
          {item.mood && item.mood !== 'Neutral' && (
            <AppText className="text-xs mb-sm">{getMoodEmoji(item.mood)}</AppText>
          )}
          <View
            className="rounded-sm px-sm py-xxs mb-sm"
            style={{ backgroundColor: `${color}18` }}
          >
            <AppText style={{ color }} className="text-[10px] font-bold">Lv {level}</AppText>
          </View>
          <AppText className={`${mutedClass} text-xs text-center`} numberOfLines={2}>
            {item.personality}
          </AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
};
