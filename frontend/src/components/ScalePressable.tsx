import React from 'react';
import { Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

interface ScalePressableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A pressable component that scales down slightly when pressed.
 *
 * Used for interactive elements to provide visual feedback upon user interaction.
 *
 * @param props.children - The content to render inside the pressable.
 * @param props.style - Optional style to apply to the pressable.
 * @param props.onPressIn - Optional callback invoked when the user presses down.
 * @param props.onPressOut - Optional callback invoked when the user releases the press.
 * @param props.disabled - Standard React Native disabled prop.
 */
export const ScalePressable = ({
  children,
  style,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: ScalePressableProps) => {
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      disabled={disabled}
      onPressIn={(e) => {
        if (!disabled) {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 300 });
        }
        if (onPressIn) onPressIn(e);
      }}
      onPressOut={(e) => {
        if (!disabled) {
          scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        }
        if (onPressOut) onPressOut(e);
      }}
      style={[style, animStyle]}
      {...props}
    >
      {children}
    </AnimatedPressable>
  );
};
