/**
 * AgentActivityIndicator — shows real-time agent status pushed via the
 * WebSocket hub (SignalR-style agent_activity frames).
 *
 * Displays: animated dots + the current activity label + optional detail text.
 * Fades in/out smoothly when the activity changes.
 */

import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { theme } from '../core/theme';
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
        { width: 5, height: 5, borderRadius: 2.5, backgroundColor: color, marginHorizontal: 2 },
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

function activityColor(activity: AgentActivityData['activity']): string {
  switch (activity) {
    case 'thinking':
      return theme.colors.primary.DEFAULT;
    case 'using_tool':
      return theme.colors.status.info;
    case 'done':
      return theme.colors.status.success;
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
  const color = activityColor(activity.activity);
  const names = activity.agent_names.join(', ');
  const label = activityLabel(activity.activity);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      style={styles.container}
    >
      {/* Agent avatar chip */}
      <View style={styles.chipContainer}>
        <View style={[styles.chipBackground, { backgroundColor: color, opacity: 0.15 }]} />
        <View style={[styles.chipBorder, { borderColor: color, opacity: 0.3 }]} />
        <AppText variant="caption" style={[styles.chipText, { color }]}>{names}</AppText>
      </View>

      {/* Status label */}
      <AppText variant="caption" style={styles.statusLabel}>{label}</AppText>

      {/* Animated dots */}
      <View style={styles.dotsContainer}>
        <Dot delay={0} color={color} />
        <Dot delay={140} color={color} />
        <Dot delay={280} color={color} />
      </View>

      {/* Optional tool/detail text */}
      {activity.activity === 'using_tool' && !!activity.detail && (
        <AppText variant="caption" style={styles.detailText} numberOfLines={1}>
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
  chipContainer: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  chipBorder: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: 1,
    borderRadius: theme.borderRadius.md,
  },
  chipText: {
    fontWeight: '600',
  },
  statusLabel: {
    color: theme.colors.onSurface.mutedLight,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailText: {
    color: theme.colors.onSurface.disabledLight,
    flex: 1,
  },
});
