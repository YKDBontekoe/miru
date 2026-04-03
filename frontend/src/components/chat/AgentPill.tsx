import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { getAgentColor } from '@/utils/colors';

const C = {
  muted: '#606490',
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
  return (
    <ScalePressable onPress={onPress} style={{ width: 72, alignItems: 'center', marginEnd: 12 }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: `${color}18`,
          borderWidth: 1.5,
          borderColor: `${color}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <AppText style={{ color, fontSize: 20, fontWeight: '700' }}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={{ textAlign: 'center', fontSize: 11, color: C.muted }}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
});

AgentPill.displayName = 'AgentPill';
