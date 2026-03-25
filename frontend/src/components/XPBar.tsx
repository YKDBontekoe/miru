import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

interface XPBarProps {
  progress: number;
  color: string;
}

export function XPBar({ progress, color }: XPBarProps) {
  const width = useSharedValue(0);
  const animStyle = useAnimatedStyle(() => ({ width: `${width.value}%` as `${number}%` }));

  useEffect(() => {
    width.value = withDelay(
      250,
      withSpring(Math.min(progress * 100, 100), { damping: 20, stiffness: 90 })
    );
  }, [progress, width]);

  return (
    <View
      style={{
        height: 4,
        backgroundColor: `${color}22`,
        borderRadius: 2,
        overflow: 'hidden',
        flex: 1,
      }}
    >
      <Animated.View style={[{ height: 4, backgroundColor: color, borderRadius: 2 }, animStyle]} />
    </View>
  );
}
