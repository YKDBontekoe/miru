import React from 'react';
import { View, Pressable, ViewProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

export const AppCard = React.memo(function AppCard({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  ...props
}: AppCardProps) {
  const baseClasses = 'bg-surface-light dark:bg-surface-dark rounded-md p-lg';
  const borderClasses = showBorder ? 'border border-border-light dark:border-border-dark' : '';

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 100 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  const CardComponent = (
    <View className={`${baseClasses} ${borderClasses} ${className}`} style={style} {...props}>
      {children}
    </View>
  );

  if (onTap) {
    return (
      <Pressable onPress={onTap} onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={animatedStyle}>{CardComponent}</Animated.View>
      </Pressable>
    );
  }

  return CardComponent;
});
