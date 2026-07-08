import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { AppCard } from './AppCard';

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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
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
    return () => cancelAnimation(opacity);
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  // We apply tailwind classes for colors mapped to the theme
  // and inline styles for the explicit dynamic dimensions passed as props.
  const bgClass = isDark ? 'bg-surface-highestDark' : 'bg-surface-highestLight';

  return (
    <Animated.View
      className={bgClass}
      style={[
        {
          width,
          height,
          borderRadius,
        },
        animStyle,
      ]}
    />
  );
}

export function SkeletonAgentCard({ index = 0 }: { index?: number }) {
  const baseDelay = index * 120;

  return (
    <AppCard elevation="md" className="mb-md">
      <View className="flex-row items-center">
        {/* Avatar */}
        <ShimmerBox width={48} height={48} borderRadius={24} delay={baseDelay} />

        <View className="flex-1 ms-md gap-sm">
          <ShimmerBox width="55%" height={14} delay={baseDelay + 60} />
          <ShimmerBox width="85%" height={10} delay={baseDelay + 120} />
          <View className="flex-row gap-xs">
            <ShimmerBox width={36} height={18} borderRadius={9} delay={baseDelay + 180} />
            <ShimmerBox width={60} height={18} borderRadius={9} delay={baseDelay + 200} />
          </View>
        </View>

        <View className="items-end gap-sm">
          <ShimmerBox width={32} height={10} delay={baseDelay + 80} />
          <ShimmerBox width={14} height={14} borderRadius={7} delay={baseDelay + 140} />
        </View>
      </View>
    </AppCard>
  );
}
