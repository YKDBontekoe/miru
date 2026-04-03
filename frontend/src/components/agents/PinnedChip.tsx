import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { getAgentColor } from './agentUtils';
import { Agent } from '../../core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

interface PinnedChipProps {
  agent: Agent;
  onPress: () => void;
}

export function PinnedChip({ agent, onPress }: PinnedChipProps) {
  const color = getAgentColor(agent.name);

  return (
    <ScalePressable onPress={onPress} style={{ alignItems: 'center', marginEnd: 14, width: 64 }}>
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: `${color}18`,
          borderWidth: 2,
          borderColor: `${color}45`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <AppText style={{ color, fontSize: 22, fontWeight: '700' }}>
          {agent.name?.[0]?.toUpperCase() ?? ''}
        </AppText>
        <View
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            backgroundColor: '#F59E0B',
            width: 14,
            height: 14,
            borderRadius: 7,
            alignItems: 'center',
            justifyContent: 'center',
            borderWidth: 1.5,
            borderColor: DESIGN_TOKENS.colors.surface,
          }}
        >
          <Ionicons name="star" size={7} color="white" />
        </View>
      </View>
      <AppText
        style={{ fontSize: 11, color: DESIGN_TOKENS.colors.muted, textAlign: 'center' }}
        numberOfLines={1}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
}
