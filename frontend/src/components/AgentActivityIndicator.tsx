/**
 * AgentActivityIndicator — shows real-time agent status pushed via the
 * WebSocket hub (SignalR-style agent_activity frames).
 *
 * Displays: animated dots + the current activity label + optional detail text.
 * Fades in/out smoothly when the activity changes.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSequence,
  withDelay,
  FadeIn,
  FadeOut,
  Easing,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import type { AgentActivityData } from '../core/services/ChatHubService';
import { useTheme, ThemeColors } from '../hooks/useTheme';
import { theme } from '../core/theme';

// ---------------------------------------------------------------------------
// Bouncing dot (reused from TypingIndicator pattern)
// ---------------------------------------------------------------------------

/**
 * A single animated bouncing dot used in the typing indicator.
 *
 * @param props.delay - The animation delay in milliseconds (staggers the dots).
 * @param props.color - The hex color for the dot.
 */
const Dot = ({ delay, color }: { delay: number; color: string }) => {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, { duration: 380, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0, { duration: 380, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        true
      )
    );
  }, [delay, ty]);

  const style = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        style,
      ]}
    />
  );
};

// ---------------------------------------------------------------------------
// Activity label helpers
// ---------------------------------------------------------------------------

function activityLabel(activity: AgentActivityData['activity']): string {
  switch (activity) {
    case 'thinking':
      return 'thinking';
    case 'using_tool':
      return 'working';
    case 'done':
      return 'done';
  }
}

function activityColor(activity: AgentActivityData['activity'], C: ThemeColors): string {
  switch (activity) {
    case 'thinking':
      return C.primary;
    case 'using_tool':
      return C.primarySurface;
    case 'done':
      return C.success;
  }
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface AgentActivityIndicatorProps {
  activity: AgentActivityData;
}

/**
 * Renders an animated status indicator for an active agent.
 *
 * This component fades in and out smoothly when the activity changes, and
 * displays a label and optional detail string indicating what the agent
 * is currently doing (e.g. "thinking", "working").
 *
 * @param props.activity - The current activity state of the agent, containing status,
 *                         agent names, and optional detail.
 */
export function AgentActivityIndicator({ activity }: AgentActivityIndicatorProps) {
  const { C } = useTheme();
  const color = activityColor(activity.activity, C);
  const names = activity.agent_names.join(', ');
  const label = activityLabel(activity.activity);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      {/* Agent avatar chip */}
      <View
        style={[
          styles.chip,
          {
            backgroundColor: `${color}15`,
            borderColor: `${color}30`,
          },
        ]}
      >
        <AppText style={[styles.avatarText, { color }]}>{names}</AppText>
      </View>

      {/* Status label */}
      <AppText style={[styles.statusText, { color: C.muted }]}>{label}</AppText>

      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        <Dot delay={0} color={color} />
        <Dot delay={140} color={color} />
        <Dot delay={280} color={color} />
      </View>

      {/* Optional tool/detail text */}
      {activity.activity === 'using_tool' && !!activity.detail && (
        <AppText style={[styles.detailText, { color: C.subtext }]} numberOfLines={1}>
          {activity.detail}
        </AppText>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.bubblePaddingH,
    paddingVertical: theme.spacing.bubblePaddingV,
    gap: theme.spacing.sm,
  },
  chip: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  statusText: {
    fontSize: theme.typography.caption.fontSize,
  },
  detailText: {
    fontSize: theme.typography.caption.fontSize,
    flex: 1,
  },
  avatarText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dot: {
    width: theme.spacing.xs + 1,
    height: theme.spacing.xs + 1,
    borderRadius: theme.spacing.xs,
    marginHorizontal: theme.spacing.xxs,
  },
});
