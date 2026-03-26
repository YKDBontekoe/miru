import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';

function ShimmerBox({
  width,
  height = 12,
  borderRadius = 6,
  delay = 0,
}: {
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  delay?: number;
}) {
  const { isDark } = useTheme();
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(withTiming(0.35, { duration: 750 }), withTiming(1, { duration: 750 })),
        -1,
        false
      )
    );
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: isDark ? '#2E2E48' : '#E4E4F0',
        },
        animStyle,
      ]}
    />
  );
}

export function SkeletonAgentCard({ index = 0 }: { index?: number }) {
  const { C } = useTheme();
  const baseDelay = index * 120;

  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 18,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.border,
        borderLeftWidth: 3,
        borderLeftColor: C.faint,
        padding: 16,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        {/* Avatar */}
        <ShimmerBox width={48} height={48} borderRadius={24} delay={baseDelay} />

        <View style={{ flex: 1, marginStart: 12, gap: 8 }}>
          <ShimmerBox width="55%" height={14} delay={baseDelay + 60} />
          <ShimmerBox width="85%" height={10} delay={baseDelay + 120} />
          <View style={{ flexDirection: 'row', gap: 6 }}>
            <ShimmerBox width={36} height={18} borderRadius={9} delay={baseDelay + 180} />
            <ShimmerBox width={60} height={18} borderRadius={9} delay={baseDelay + 200} />
          </View>
        </View>

        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <ShimmerBox width={32} height={10} delay={baseDelay + 80} />
          <ShimmerBox width={14} height={14} borderRadius={7} delay={baseDelay + 140} />
        </View>
      </View>
    </View>
  );
}
