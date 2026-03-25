import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';

interface TypingIndicatorProps {
  dotColor?: string;
}

/**
 * A sub-component that renders an animated dot for the typing indicator.
 *
 * @param props - Component props
 * @param props.delay - The animation delay in milliseconds.
 * @param props.color - The dot color.
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
      style={[{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }, animatedStyle]}
      className="mx-[2px]"
    />
  );
};

/**
 * An animated indicator showing that someone is currently typing.
 *
 * @param props - Component props
 * @param props.dotColor - Optional color to apply to the dots.
 */
export function TypingIndicator({ dotColor = '#A0A0B0' }: TypingIndicatorProps) {
  return (
    <View className="flex-row items-center h-4 px-xs">
      <Dot delay={0} color={dotColor} />
      <Dot delay={150} color={dotColor} />
      <Dot delay={300} color={dotColor} />
    </View>
  );
}
