import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';

export const HomeAgentChip = React.memo(function HomeAgentChip({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const containerClass = isDark
    ? 'flex-row items-center bg-primary-DEFAULT/20 rounded-[22px] py-2 px-3 mr-2 mb-2'
    : 'flex-row items-center bg-primary-surfaceLight rounded-[22px] py-2 px-3 mr-2 mb-2';

  const avatarClass = isDark
    ? 'w-[26px] h-[26px] rounded-[13px] bg-primary-dark items-center justify-center mr-[7px]'
    : 'w-[26px] h-[26px] rounded-[13px] bg-primary-light items-center justify-center mr-[7px]';

  const avatarTextClass = isDark
    ? 'text-primary-light text-[12px] font-bold'
    : 'text-primary-DEFAULT text-[12px] font-bold';

  const nameTextClass = isDark
    ? 'text-[13px] font-semibold text-onSurface-dark'
    : 'text-[13px] font-semibold text-onSurface-light';

  return (
    <ScalePressable onPress={onPress} className={containerClass}>
      <View className={avatarClass}>
        <AppText className={avatarTextClass}>
          {agent.name?.[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <AppText className={nameTextClass}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View className="bg-primary-DEFAULT rounded-[9px] min-w-[18px] h-[18px] px-1.5 items-center justify-center ml-[7px]">
          <AppText className="text-[10px] text-white font-bold">{agent.message_count}</AppText>
        </View>
      )}
    </ScalePressable>
  );
});
