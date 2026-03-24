import React, { useCallback } from 'react';
import { Pressable, ActivityIndicator, PressableProps, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppText } from './AppText';

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// DOCS(miru-agent): needs documentation
export function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  style,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;
  const pressed = useSharedValue(0);

  const handlePressIn = useCallback(() => {
    pressed.value = withSpring(1, { damping: 15, stiffness: 200 });
  }, [pressed]);

  const handlePressOut = useCallback(() => {
    pressed.value = withSpring(0, { damping: 15, stiffness: 200 });
  }, [pressed]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: 1 - pressed.value * 0.02 }],
      opacity: isDisabled ? 0.6 : 1 - pressed.value * 0.1,
    };
  });

  let bgClass = '';
  let textClass = '';
  let borderClass = '';

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
      bgClass = 'bg-transparent';
      borderClass = 'border-2 border-border-light dark:border-border-dark';
      textClass = 'text-onSurface-light dark:text-onSurface-dark';
      break;
    case 'ghost':
      bgClass = 'bg-transparent';
      textClass = 'text-primary';
      break;
  }

  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={isDisabled}
      testID="app-button"
      className={`h-[48px] flex-row items-center justify-center rounded-xl px-lg ${bgClass} ${borderClass} ${className}`}
      style={[animatedStyle, style as StyleProp<ViewStyle>]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' && !isDisabled ? 'white' : '#60A5FA'} />
      ) : (
        <AppText variant="body" className={`font-semibold ${textClass}`}>
          {label}
        </AppText>
      )}
    </AnimatedPressable>
  );
}
