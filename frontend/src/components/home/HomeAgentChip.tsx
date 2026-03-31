import React from 'react';
import { View } from 'react-native';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { Agent } from '../../core/models';

const C = {
  primaryFaint: '#EEF4FF',
  primaryLight: '#DBEAFE',
  primary: '#2563EB',
  text: '#0A0E2E',
};

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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.primaryFaint,
        borderRadius: 22,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: C.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 7,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <AppText style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View
          style={{
            backgroundColor: C.primary,
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
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
