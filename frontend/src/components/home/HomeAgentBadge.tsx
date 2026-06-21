import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { HOME_COLORS } from '@/components/home/homeTheme';

export const HomeAgentBadge = ({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      className="rounded-[18px] border p-2.5 w-[48.5%] mb-2.5"
      style={{
        borderColor: HOME_COLORS.border,
        backgroundColor: HOME_COLORS.surface,
      }}
    >
      <View className="flex-row items-center mb-1.5">
        <View
          className="w-[30px] h-[30px] rounded-md items-center justify-center mr-2"
          style={{
            backgroundColor: HOME_COLORS.primarySoft,
          }}
        >
          <AppText variant="bodySm" className="font-extrabold" style={{ color: HOME_COLORS.primary }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="bodySm" numberOfLines={1} className="font-bold" style={{ color: HOME_COLORS.text }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
        {agent.message_count} {agent.message_count === 1 ? 'message' : 'messages'}
      </AppText>
    </ScalePressable>
  );
};
