import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { getAgentColor } from '@/utils/colors';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

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
  const { C } = useTheme();
  const initial = agent?.name ? agent.name[0].toUpperCase() : '?';

  return (
    <ScalePressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: `${color}18`,
            borderColor: `${color}40`,
          },
        ]}
      >
        <AppText style={[styles.avatarText, { color }]}>
          {initial}
        </AppText>
      </View>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={[styles.nameText, { color: C.muted }]}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
});

AgentPill.displayName = 'AgentPill';

const styles = StyleSheet.create({
  container: {
    width: 72,
    alignItems: 'center',
    marginEnd: theme.spacing.md,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1.5,
  },
  avatarText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  nameText: {
    textAlign: 'center',
    fontSize: 11,
  },
});
