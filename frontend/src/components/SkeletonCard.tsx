import React, { useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
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
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

interface ShimmerBoxProps {
  width: number | `${number}%`;
  height?: number;
  borderRadius?: number;
  delay?: number;
}

const ShimmerBox: React.FC<ShimmerBoxProps> = ({
  width,
  height = 12,
  borderRadius = 6,
  delay = 0,
}) => {
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
    return () => cancelAnimation(opacity);
  }, [delay, opacity]);

  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  const bgColor = isDark
    ? theme.colors.surface.highestDark
    : theme.colors.surface.highestLight;

  return (
    <Animated.View
      style={[
        {
          width,
          height,
          borderRadius,
          backgroundColor: bgColor,
        },
        animStyle,
      ]}
    />
  );
};

export const SkeletonAgentCard: React.FC<{ index?: number }> = ({ index = 0 }) => {
  const { C } = useTheme();
  const baseDelay = index * 120;

  return (
    <View
      style={[
        styles.cardContainer,
        { backgroundColor: C.surface }
      ]}
    >
      <View style={styles.row}>
        {/* Avatar */}
        <ShimmerBox width={48} height={48} borderRadius={24} delay={baseDelay} />

        <View style={styles.centerCol}>
          <ShimmerBox width="55%" height={14} delay={baseDelay + 60} />
          <ShimmerBox width="85%" height={10} delay={baseDelay + 120} />
          <View style={styles.tagsRow}>
            <ShimmerBox width={36} height={18} borderRadius={9} delay={baseDelay + 180} />
            <ShimmerBox width={60} height={18} borderRadius={9} delay={baseDelay + 200} />
          </View>
        </View>

        <View style={styles.rightCol}>
          <ShimmerBox width={32} height={10} delay={baseDelay + 80} />
          <ShimmerBox width={14} height={14} borderRadius={7} delay={baseDelay + 140} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: theme.borderRadius.xl,
    marginBottom: theme.spacing.md,
    padding: theme.spacing.lg,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.sm,
    }),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  centerCol: {
    flex: 1,
    marginStart: theme.spacing.md,
    gap: theme.spacing.sm,
  },
  tagsRow: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  rightCol: {
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
  },
});
