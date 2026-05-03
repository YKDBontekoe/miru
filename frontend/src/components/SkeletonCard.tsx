import React, { useEffect, useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  cancelAnimation,
} from 'react-native-reanimated';
import { useTheme } from '../hooks/useTheme';
import { theme } from '../core/theme';

function ShimmerBox({
  width,
  height = 12,
  borderRadius = theme.borderRadius.xs,
  delay = 0,
}: {
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  delay?: number;
}) {
  const { C } = useTheme();
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

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: C.surfaceHigh,
        },
        animStyle,
      ]}
    />
  );
}

export function SkeletonAgentCard({ index = 0 }: { index?: number }) {
  const { C } = useTheme();
  const baseDelay = index * 120;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: {
          backgroundColor: C.surface,
          borderRadius: theme.borderRadius.xl,
          marginBottom: theme.spacing.md,
          padding: theme.spacing.lg,
          ...theme.elevation.sm,
          shadowColor: C.primary,
        },
        row: {
          flexDirection: 'row',
          alignItems: 'center',
        },
        contentContainer: {
          flex: 1,
          marginStart: theme.spacing.md,
          gap: theme.spacing.sm,
        },
        pillRow: {
          flexDirection: 'row',
          gap: theme.spacing.xs,
        },
        rightActionContainer: {
          alignItems: 'flex-end',
          gap: theme.spacing.sm,
        },
      }),
    [C]
  );

  return (
    <View style={styles.card}>
      <View style={styles.row}>
        {/* Avatar */}
        <ShimmerBox width={48} height={48} borderRadius={theme.borderRadius.full} delay={baseDelay} />

        <View style={styles.contentContainer}>
          <ShimmerBox width="55%" height={14} delay={baseDelay + 60} />
          <ShimmerBox width="85%" height={10} delay={baseDelay + 120} />
          <View style={styles.pillRow}>
            <ShimmerBox width={36} height={18} borderRadius={theme.borderRadius.md} delay={baseDelay + 180} />
            <ShimmerBox width={60} height={18} borderRadius={theme.borderRadius.md} delay={baseDelay + 200} />
          </View>
        </View>

        <View style={styles.rightActionContainer}>
          <ShimmerBox width={32} height={10} delay={baseDelay + 80} />
          <ShimmerBox width={14} height={14} borderRadius={theme.borderRadius.full} delay={baseDelay + 140} />
        </View>
      </View>
    </View>
  );
}
