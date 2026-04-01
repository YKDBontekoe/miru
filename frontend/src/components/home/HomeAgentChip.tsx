import React from 'react';
import { View } from 'react-native';
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
  return (
    <ScalePressable
      onPress={onPress}
      className="flex-row items-center bg-primaryFaint rounded-[22px] py-2 px-3 mr-2 mb-2"
    >
      <View
        className="w-[26px] h-[26px] rounded-[13px] bg-primaryLight items-center justify-center mr-[7px]"
      >
        <AppText className="text-primary text-[12px] font-bold">
          {agent.name?.[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <AppText className="text-[13px] font-semibold text-text">{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View
          className="bg-primary rounded-[9px] min-w-[18px] h-[18px] px-1.5 items-center justify-center ml-[7px]"
        >
          <AppText className="text-[10px] text-white font-bold">
            {agent.message_count}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
});
