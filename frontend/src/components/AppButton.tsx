import React from 'react';
import { ActivityIndicator, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppText } from './AppText';

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  style,
  ...props
}: AppButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = (e: any) => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    props.onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    props.onPressOut?.(e);
  };
  const isDisabled = disabled || isLoading;

  let bgClass = '';
  let textClass = '';

  switch (variant) {
    case 'primary':
      bgClass = isDisabled ? 'bg-surface-highestLight dark:bg-surface-highestDark' : 'bg-primary';
      textClass = isDisabled
        ? 'text-onSurface-disabledLight dark:text-onSurface-disabledDark'
        : 'text-white';
      break;
    case 'secondary':
      bgClass = 'bg-surface-highLight dark:bg-surface-highDark';
      textClass = 'text-onSurface-light dark:text-onSurface-dark';
      break;
    case 'outline':
      bgClass = 'border border-border-light dark:border-border-dark bg-transparent';
      textClass = 'text-onSurface-light dark:text-onSurface-dark';
      break;
    case 'ghost':
      bgClass = 'bg-transparent';
      textClass = 'text-primary';
      break;
  }

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        {...props}
        disabled={isDisabled}
        testID="app-button"
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`h-[44px] flex-row items-center justify-center rounded-xl px-lg ${bgClass} ${className}`}
      >
        {isLoading ? (
          <ActivityIndicator color={variant === 'primary' && !isDisabled ? 'white' : '#60A5FA'} />
        ) : (
          <AppText className={`font-semibold ${textClass}`}>{label}</AppText>
        )}
      </Pressable>
    </Animated.View>
  );
}
