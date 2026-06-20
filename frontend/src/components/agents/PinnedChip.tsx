import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { getAgentColor } from './agentUtils';
import { Agent } from '../../core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface PinnedChipProps {
  agent: Agent;
  onPress: () => void;
}

export function PinnedChip({ agent, onPress }: PinnedChipProps) {
  const color = getAgentColor(agent.name);
  const { C } = useTheme();



  return (
    <ScalePressable onPress={onPress} className="items-center mr-3 w-16">
      <View
        className="w-14 h-14 rounded-full border-2 items-center justify-center mb-1"
        style={{ backgroundColor: `${color}18`, borderColor: `${color}45` }}
      >
        <AppText className="text-xl font-bold"
          style={{ color }}>
          {agent.name?.[0]?.toUpperCase() ?? ''}
        </AppText>
        <View
          className="absolute -bottom-0.5 -right-0.5 bg-amber-500 w-4 h-4 rounded-full items-center justify-center border-2 border-surface"
        >
          <Ionicons name="star" size={7} color="white" />
        </View>
      </View>
      <AppText
        className="text-[11px] text-muted text-center"
        numberOfLines={1}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
}
