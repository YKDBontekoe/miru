import React from 'react';
import { Pressable, ActivityIndicator, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { AppText } from './AppText';

export interface AppButtonProps extends PressableProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

export const AppButton = React.memo(function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: AppButtonProps) {
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

  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  const handlePressIn = () => {
    if (isDisabled) return;
    scale.value = withTiming(0.98, { duration: 100 });
    opacity.value = withTiming(0.8, { duration: 100 });
  };

  const handlePressOut = () => {
    if (isDisabled) return;
    scale.value = withTiming(1, { duration: 150 });
    opacity.value = withTiming(1, { duration: 150 });
  };

  return (
    <Pressable
      disabled={isDisabled}
      testID="app-button"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`h-[44px] flex-row items-center justify-center rounded-xl px-lg ${bgClass} ${className}`}
      {...props}
    >
      <Animated.View style={animatedStyle} className="flex-row items-center justify-center w-full h-full">
        {isLoading ? (
          <ActivityIndicator color={variant === 'primary' && !isDisabled ? 'white' : '#60A5FA'} />
        ) : (
          <AppText className={`font-semibold ${textClass}`}>{label}</AppText>
        )}
      </Animated.View>
    </Pressable>
  );
});
