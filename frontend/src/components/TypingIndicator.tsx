import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '@/core/theme';

interface TypingIndicatorProps {
  dotColor?: string;
}

/**
 * A single animated bouncing dot used in the typing indicator.
 *
 * @param props.delay - The animation delay in milliseconds (staggers the dots).
 * @param props.color - The hex color for the dot.
 */
const Dot = ({ delay, color }: { delay: number; color: string }) => {
  const translateY = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-6, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) }),
          withTiming(0, { duration: 400, easing: Easing.bezier(0.4, 0, 0.6, 1) })
        ),
        -1,
        true
      )
    );
  }, [delay, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.dot,
        { backgroundColor: color },
        animatedStyle
      ]}
    />
  );
};

/**
 * An animated three-dot typing indicator.
 *
 * Used to indicate that an agent is currently streaming a response or "typing".
 *
 * @param props.dotColor - The color of the animated dots (defaults to a neutral gray).
 */
export function TypingIndicator({ dotColor }: TypingIndicatorProps) {
  const defaultColor = theme.colors.onSurface.mutedDark;
  const activeColor = dotColor || defaultColor;

  return (
    <View style={styles.container}>
      <Dot delay={0} color={activeColor} />
      <Dot delay={150} color={activeColor} />
      <Dot delay={300} color={activeColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: theme.spacing.lg,
    paddingHorizontal: theme.spacing.xs,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: theme.borderRadius.full,
    marginHorizontal: 2,
  },
});
