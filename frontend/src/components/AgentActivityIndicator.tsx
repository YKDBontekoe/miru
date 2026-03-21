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
  Easing,
} from 'react-native-reanimated';
import { AppText } from './AppText';
import type { AgentActivityData } from '../core/services/ChatHubService';

// ---------------------------------------------------------------------------
// Bouncing dot (reused from TypingIndicator pattern)
// ---------------------------------------------------------------------------

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
      return '#2563EB';
    case 'using_tool':
      return '#7C3AED';
    case 'done':
      return '#059669';
  }
}

// ---------------------------------------------------------------------------
// Public component
// ---------------------------------------------------------------------------

interface AgentActivityIndicatorProps {
  activity: AgentActivityData;
}

export function AgentActivityIndicator({ activity }: AgentActivityIndicatorProps) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 200 });
    return () => {
      opacity.value = withTiming(0, { duration: 150 });
    };
  }, [opacity]);

  const containerStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const color = activityColor(activity.activity);
  const names = activity.agent_names.join(', ');
  const label = activityLabel(activity.activity);

  return (
    <Animated.View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 14,
          paddingVertical: 10,
          gap: 8,
        },
        containerStyle,
      ]}
    >
      {/* Agent avatar chip */}
      <View
        style={{
          paddingHorizontal: 8,
          paddingVertical: 3,
          borderRadius: 10,
          backgroundColor: `${color}15`,
          borderWidth: 1,
          borderColor: `${color}30`,
        }}
      >
        <AppText style={{ fontSize: 11, fontWeight: '600', color }}>{names}</AppText>
      </View>

      {/* Status label */}
      <AppText style={{ fontSize: 12, color: '#6E6E80' }}>{label}</AppText>

      {/* Animated dots */}
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Dot delay={0} color={color} />
        <Dot delay={140} color={color} />
        <Dot delay={280} color={color} />
      </View>

      {/* Optional tool/detail text */}
      {activity.activity === 'using_tool' && !!activity.detail && (
        <AppText style={{ fontSize: 11, color: '#9E9EAF', flex: 1 }} numberOfLines={1}>
          {activity.detail}
        </AppText>
      )}
    </Animated.View>
  );
}
