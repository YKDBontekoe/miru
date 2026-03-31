import React from 'react';
import { View } from 'react-native';
import { AppText } from '../../AppText';
import { useTheme } from '../../../hooks/useTheme';
import { Agent } from '../../../core/models';

interface AgentDetailStatsProps {
  agent: Agent;
  level: number;
  displayColor: string;
}

export function AgentDetailStats({ agent, level, displayColor }: AgentDetailStatsProps) {
  const { C } = useTheme();

  return (
    <View
      style={{
        flexDirection: 'row',
        backgroundColor: C.surfaceHigh,
        borderRadius: 16,
        padding: 16,
        marginBottom: 18,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      {[
        { value: agent.message_count, label: 'Messages' },
        { value: level, label: 'Level' },
        { value: agent.integrations?.length ?? 0, label: 'Skills' },
      ].map((stat, i, arr) => (
        <React.Fragment key={stat.label}>
          <View style={{ flex: 1, alignItems: 'center' }}>
            <AppText style={{ color: displayColor, fontWeight: '800', fontSize: 22 }}>
              {stat.value}
            </AppText>
            <AppText style={{ color: C.muted, fontSize: 11, marginTop: 1 }}>
              {stat.label}
            </AppText>
          </View>
          {i < arr.length - 1 && (
            <View style={{ width: 1, backgroundColor: C.border, marginVertical: 4 }} />
          )}
        </React.Fragment>
      ))}
    </View>
  );
}
