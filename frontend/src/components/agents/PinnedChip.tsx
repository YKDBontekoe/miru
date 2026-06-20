import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { getAgentColor } from './agentUtils';
import { Agent } from '../../core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';
import { StyleSheet } from 'react-native';

interface PinnedChipProps {
  agent: Agent;
  onPress: () => void;
}

export function PinnedChip({ agent, onPress }: PinnedChipProps) {
  const color = getAgentColor(agent.name);
  const { C } = useTheme();


  const styles = StyleSheet.create({
    container: {
      alignItems: 'center',
      marginEnd: theme.spacing.md + 2,
      width: theme.spacing.colossal,
    },
    avatarWrapper: {
      width: theme.spacing.massive + 4,
      height: theme.spacing.massive + 4,
      borderRadius: (theme.spacing.massive + 4) / 2,
      borderWidth: 2,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: theme.spacing.sm - 2,
    },
    avatarText: {
      fontSize: theme.typography.h3.fontSize + 2,
      fontWeight: '700',
    },
    pinBadge: {
      position: 'absolute',
      bottom: -2,
      right: -2,
      backgroundColor: theme.colors.status.warning,
      width: theme.spacing.md + 2,
      height: theme.spacing.md + 2,
      borderRadius: (theme.spacing.md + 2) / 2,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: C.surface,
    },
    nameText: {
      fontSize: theme.typography.caption.fontSize - 1,
      color: C.muted,
      textAlign: 'center',
    },
  });

  return (
    <ScalePressable onPress={onPress} style={styles.container}>
      <View
        style={[styles.avatarWrapper, { backgroundColor: `${color}18`, borderColor: `${color}45` }]}
      >
        <AppText style={[styles.avatarText, { color }]}>
          {agent.name?.[0]?.toUpperCase() ?? ''}
        </AppText>
        <View
          style={styles.pinBadge}
        >
          <Ionicons name="star" size={7} color="white" />
        </View>
      </View>
      <AppText
        style={styles.nameText}
        numberOfLines={1}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
}
