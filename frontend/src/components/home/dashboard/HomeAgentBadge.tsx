import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { HOME_COLORS } from '../homeTheme';

export function HomeAgentBadge({
  agent,
  onPress,
  t,
}: {
  agent: Agent;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      className="rounded-[18px] border p-2.5 w-[48.5%] mb-2.5"
      style={{
        borderColor: HOME_COLORS.border,
        backgroundColor: HOME_COLORS.surface,
      }}
    >
      <View className="flex-row items-center mb-[6px]">
        <View
          className="w-[30px] h-[30px] rounded-[10px] items-center justify-center mr-2"
          style={{
            backgroundColor: HOME_COLORS.primarySoft,
          }}
        >
          <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
        {t('home.agent_badge.message_count', { count: agent.message_count, defaultValue: '{{count}} messages' })}
      </AppText>
    </ScalePressable>
  );
}
