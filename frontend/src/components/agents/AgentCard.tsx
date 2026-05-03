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
        <View
          className="rounded-[20px] mb-4"
          style={{
            backgroundColor: C.surface,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 2
          }}
        >
          <View className="flex-row items-center py-4 pe-4 ps-6">
            <AgentAvatar name={item.name} size={48} color={color} />
            <View className="flex-1 ms-4">
              <View className="flex-row items-center gap-2 mb-1">
                <AppText
                  className="font-bold"
                  style={{ ...theme.typography.body, color: C.text }}
                >
                  {item.name}
                </AppText>
                {item.mood && item.mood !== 'Neutral' && (
                  <AppText style={{ fontSize: theme.typography.caption.fontSize + 1 }}>{getMoodEmoji(item.mood)}</AppText>
                )}
                {isPinned && <Ionicons name="star" size={11} color={theme.colors.status.warning} />}
              </View>
              <AppText
                className="text-xs"
                style={{ color: C.muted, lineHeight: theme.typography.caption.fontSize * 1.4 }}
                numberOfLines={1}
              >
                {item.personality}
              </AppText>
              <View className="flex-row items-center gap-2 mt-2">
                <View className="rounded-sm px-2 py-0.5" style={{ backgroundColor: `${color}15` }}>
                  <AppText className="text-[10px] font-bold" style={{ color }}>Lv {level}</AppText>
                </View>
                <View className="flex-1 h-[3px] rounded-sm overflow-hidden" style={{ backgroundColor: `${color}18` }}>
                  <View
                    className="h-[3px] rounded-sm"
                    style={{ width: `${Math.min(Math.max(xpProgress * 100, 0), 100)}%`, backgroundColor: `${color}70` }}
                  />
                </View>
              </View>
            </View>
            <View className="items-end ms-2">
              <AppText className="text-[10px] mb-2" style={{ color: C.faint }}>{item.message_count} msgs</AppText>
              <Ionicons name="chevron-forward" size={14} color={C.faint} />
            </View>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
});

AgentCard.displayName = 'AgentCard';

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
    <Animated.View entering={FadeInDown.delay(index * 45).duration(300)} className="flex-1 max-w-[50%]">
      <ScalePressable onPress={onPress} onLongPress={onLongPress}>
        <View
          className="rounded-[20px] m-1 p-6 items-center"
          style={{
            backgroundColor: C.surface,
            shadowColor: '#2563EB',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.06,
            shadowRadius: 14,
            elevation: 2
          }}
        >
          <View className="relative mb-4">
            <AgentAvatar name={item.name} size={56} color={color} />
            {isPinned && (
              <View
                className="absolute -top-[3px] -right-[3px] w-4 h-4 rounded-sm items-center justify-center border-[1.5px]"
                style={{ backgroundColor: theme.colors.status.warning, borderColor: C.surface }}
              >
                <Ionicons name="star" size={8} color="white" />
              </View>
            )}
          </View>
          <AppText
            className="font-bold text-center mb-1"
            style={{ ...theme.typography.bodySm, color: C.text }}
            numberOfLines={1}
          >
            {item.name}
          </AppText>
          {item.mood && item.mood !== 'Neutral' && (
            <AppText style={{ fontSize: theme.typography.caption.fontSize }} className="mb-2">{getMoodEmoji(item.mood)}</AppText>
          )}
          <View className="rounded-sm px-2 py-1 mb-2" style={{ backgroundColor: `${color}18` }}>
            <AppText className="text-[10px] font-bold" style={{ color }}>Lv {level}</AppText>
          </View>
          <AppText className="text-[11px] text-center" style={{ color: C.muted }} numberOfLines={2}>
            {item.personality}
          </AppText>
        </View>
      </ScalePressable>
    </Animated.View>
  );
});

AgentGridCard.displayName = 'AgentGridCard';
