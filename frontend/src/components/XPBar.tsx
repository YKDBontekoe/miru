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

// DOCS(miru-agent): needs documentation
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
      className="h-1 rounded overflow-hidden flex-1"
      style={{ backgroundColor: `${color}22` }}
    >
      <Animated.View
        className="h-1 rounded"
        style={[{ backgroundColor: color }, animStyle]}
      />
    </View>
  );
}
