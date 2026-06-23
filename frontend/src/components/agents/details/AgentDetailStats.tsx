import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { Agent } from '@/core/models';

export interface AgentDetailStatsProps {
  agent: Agent;
  level: number;
  displayColor: string;
}

/**
 * AgentDetailStats Component
 * Displays a summary row of key statistics for an agent, such as message count, current level, and number of skills.
 *
 * @param {AgentDetailStatsProps} props - The component props.
 * @param {Agent} props.agent - The agent whose stats are being displayed.
 * @param {number} props.level - The calculated level of the agent.
 * @param {string} props.displayColor - The primary accent color used for the text values.
 * @returns {JSX.Element} The rendered statistics row.
 */
export function AgentDetailStats({ agent, level, displayColor }: AgentDetailStatsProps) {
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
