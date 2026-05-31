import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { getAgentColor } from '@/utils/colors';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarBackground, { backgroundColor: color }]} />
        <View style={[styles.avatarBorder, { borderColor: color }]} />
        <AppText variant="h3" style={[styles.initialText, { color }]}>
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
    marginRight: theme.spacing.md,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: DESIGN_TOKENS.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  avatarBackground: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DESIGN_TOKENS.radius.full,
    opacity: 0.1,
  },
  avatarBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: DESIGN_TOKENS.radius.full,
    borderWidth: 1.5,
    opacity: 0.25,
  },
  initialText: {
    fontWeight: 'bold',
  },
  nameText: {
    textAlign: 'center',
  },
});
