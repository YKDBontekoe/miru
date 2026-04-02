import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/hooks/useTheme';
import { Agent } from '@/core/models';

interface AgentDetailStatsProps {
  agent: Agent;
  level: number;
  displayColor: string;
}

export function AgentDetailStats({ agent, level, displayColor }: AgentDetailStatsProps) {
  const { C } = useTheme();
  const { t } = useTranslation();

  return (
    <View className="flex-row bg-surfaceHigh rounded-2xl p-4 mb-4 border border-border">
      {[
        { value: agent.message_count, label: t('agents.stats.messages', 'Messages') },
        { value: level, label: t('agents.stats.level', 'Level') },
        { value: agent.integrations?.length ?? 0, label: t('agents.stats.skills', 'Skills') },
      ].map((stat, i, arr) => (
        <React.Fragment key={stat.label}>
          <View className="flex-1 items-center">
            <AppText className="font-extrabold text-[22px]" style={{ color: displayColor }}>
              {stat.value}
            </AppText>
            <AppText className="text-muted text-[11px] mt-0.5">{stat.label}</AppText>
          </View>
          {i < arr.length - 1 && <View className="w-[1px] bg-border my-1" />}
        </React.Fragment>
      ))}
    </View>
  );
}
