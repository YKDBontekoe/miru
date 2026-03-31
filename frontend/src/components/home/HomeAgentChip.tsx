import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { getAgentColor } from '@/components/agents/agentUtils';

export const HomeAgentChip = React.memo(function HomeAgentChip({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  const color = getAgentColor(agent.name);
  const bgColor = `${color}14`;
  const avatarBg = `${color}28`;

  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: bgColor,
        borderRadius: 22,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: `${color}22`,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: avatarBg,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 7,
        }}
      >
        <AppText style={{ color, fontSize: 12, fontWeight: '700' }}>
          {agent.name?.[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <AppText style={{ fontSize: 13, fontWeight: '600', color: '#0A0E2E' }}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View
          style={{
            backgroundColor: color,
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 4,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 7,
          }}
        >
          <AppText style={{ fontSize: 10, color: 'white', fontWeight: '700' }}>
            {agent.message_count}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
});
