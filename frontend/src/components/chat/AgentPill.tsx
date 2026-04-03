import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { getAgentColor } from '@/utils/colors';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  muted: DESIGN_TOKENS.colors.muted,
};

export interface AgentPillProps {
  /** The agent data to display. */
  agent: Agent;
  /** Callback fired when the pill is pressed. */
  onPress: () => void;
}

/**
 * A small pill component that displays an agent's initial and name.
 * Uses a hashed color based on the agent's name.
 */
export const AgentPill = React.memo(({ agent, onPress }: AgentPillProps) => {
  const color = getAgentColor(agent.name);
  const initial = agent?.name ? agent.name[0].toUpperCase() : '?';

  return (
    <ScalePressable onPress={onPress} className="w-[72px] items-center me-3">
      <View
        className="w-[52px] h-[52px] rounded-full items-center justify-center mb-1.5 border-[1.5px]"
        style={{
          backgroundColor: `${color}18`,
          borderColor: `${color}40`,
        }}
      >
        <AppText className="text-[20px] font-bold" style={{ color }}>
          {initial}
        </AppText>
      </View>
      <AppText
        variant="caption"
        numberOfLines={1}
        className="text-center text-[11px]"
        style={{ color: C.muted }}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
});

AgentPill.displayName = 'AgentPill';
