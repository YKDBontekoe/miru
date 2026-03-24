/**
 * AgentActivityIndicator — shows real-time agent status pushed via the
 * WebSocket hub (SignalR-style agent_activity frames).
 *
 * Displays: animated dots + the current activity label + optional detail text.
 * Fades in/out smoothly when the activity changes.
 */

import React, { useEffect } from 'react';
import { View } from 'react-native';
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

// DOCS(miru-agent): needs documentation
const Dot = ({ delay, colorClass }: { delay: number; colorClass: string }) => {
  const ty = useSharedValue(0);

  useEffect(() => {
    ty.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-5, {
            duration: 380,
            easing: Easing.bezier(0.4, 0, 0.6, 1),
          }),
          withTiming(0, { duration: 380, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        true
      )
    );
  }, [delay, ty]);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: ty.value }],
  }));

  return (
    <Animated.View className={`w-1.5 h-1.5 rounded-full mx-0.5 ${colorClass}`} style={style} />
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

function activityColorClasses(activity: AgentActivityData['activity']) {
  switch (activity) {
    case 'thinking':
      return {
        bg: 'bg-primary/10',
        border: 'border-primary/20',
        text: 'text-primary',
        dot: 'bg-primary',
      };
    case 'using_tool':
      return {
        bg: 'bg-purple-500/10',
        border: 'border-purple-500/20',
        text: 'text-purple-600',
        dot: 'bg-purple-600',
      };
    case 'done':
      return {
        bg: 'bg-status-success/10',
        border: 'border-status-success/20',
        text: 'text-status-success',
        dot: 'bg-status-success',
      };
  }
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface AgentActivityIndicatorProps {
  activity: AgentActivityData;
}

// DOCS(miru-agent): needs documentation
export function AgentActivityIndicator({ activity }: AgentActivityIndicatorProps) {
  const colors = activityColorClasses(activity.activity);
  const names = activity.agent_names.join(', ');
  const label = activityLabel(activity.activity);

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(150)}
      className="flex-row items-center px-lg py-md gap-sm"
    >
      {/* Agent avatar chip */}
      <View className={`px-sm py-xs rounded-full border ${colors.bg} ${colors.border}`}>
        <AppText variant="caption" className={`font-semibold ${colors.text}`}>
          {names}
        </AppText>
      </View>

      {/* Status label */}
      <AppText variant="caption" color="muted">
        {label}
      </AppText>

      {/* Animated dots */}
      <View className="flex-row items-center">
        <Dot delay={0} colorClass={colors.dot} />
        <Dot delay={140} colorClass={colors.dot} />
        <Dot delay={280} colorClass={colors.dot} />
      </View>

      {/* Optional tool/detail text */}
      {activity.activity === 'using_tool' && !!activity.detail && (
        <AppText
          variant="caption"
          className="text-onSurface-mutedLight dark:text-onSurface-mutedDark flex-1"
          numberOfLines={1}
        >
          {activity.detail}
        </AppText>
      )}
    </Animated.View>
  );
}
