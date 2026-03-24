import React from 'react';
import { View, Pressable, ViewProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppCard({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  ...props
}: AppCardProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const baseClasses = 'bg-surface-light dark:bg-surface-dark rounded-md p-lg shadow-sm';
  const borderClasses = showBorder ? 'border border-border-light dark:border-border-dark' : '';

  const CardComponent = (
    <View {...props} className={`${baseClasses} ${borderClasses} ${className}`} style={style}>
      {children}
    </View>
  );

  if (onTap) {
    return (
      <Animated.View style={animatedStyle}>
        <Pressable onPress={onTap} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          {CardComponent}
        </Pressable>
      </Animated.View>
    );
  }

  return CardComponent;
}
