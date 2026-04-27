import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { getAgentColor } from './agentUtils';
import { Agent } from '../../core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';

interface PinnedChipProps {
  agent: Agent;
  onPress: () => void;
}

/**
 * Renders a circular avatar chip with a star badge for pinned agents.
 *
 * Used primarily in the horizontal scroll list for quick access to pinned agents.
 * Displays the agent's initial, a star indicator for pinned status, and the
 * agent's name truncated below the avatar.
 *
 * @param agent - The agent data model to display.
 * @param onPress - Callback executed when the chip is pressed.
 *
 * @example
 * <PinnedChip agent={myAgent} onPress={() => handleOpen(myAgent.id)} />
 */
export function PinnedChip({ agent, onPress }: PinnedChipProps) {
  const color = getAgentColor(agent.name);
  const { C } = useTheme();

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
            borderColor: C.surface,
          }}
        >
          <Ionicons name="star" size={7} color="white" />
        </View>
      </View>
      <AppText
        style={{ fontSize: 11, color: C.muted, textAlign: 'center' }}
        numberOfLines={1}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
}
