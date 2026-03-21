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

export function TypingIndicator({ dotColor = '#A0A0B0' }: TypingIndicatorProps) {
  return (
    <View className="flex-row items-center h-4 px-xs">
      <Dot delay={0} color={dotColor} />
      <Dot delay={150} color={dotColor} />
      <Dot delay={300} color={dotColor} />
    </View>
  );
}
