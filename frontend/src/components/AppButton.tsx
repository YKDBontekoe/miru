import React, { useCallback } from 'react';
import { Pressable, ActivityIndicator, PressableProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';
import { AppText } from './AppText';

const fullConfig = resolveConfig(tailwindConfig);

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
  style?: any;
}

export function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  style,
  onPressIn,
  onPressOut,
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const handlePressIn = useCallback(
    (e: any) => {
      if (!isDisabled) {
        scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(0.8, { duration: 100 });
      }
      onPressIn?.(e);
    },
    [isDisabled, scale, opacity, onPressIn]
  );

  const handlePressOut = useCallback(
    (e: any) => {
      if (!isDisabled) {
        scale.value = withSpring(1, { damping: 15, stiffness: 300 });
        opacity.value = withTiming(1, { duration: 150 });
      }
      onPressOut?.(e);
    },
    [isDisabled, scale, opacity, onPressOut]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

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

  // Instead of hardcoding 44px height, we use Tailwind spacing which was mapped
  // in tailwind config but `h-[44px]` was magic.
  // Tailwind config has spacing: { lg: '16px', xl: '20px', xxl: '24px', xxxl: '32px', huge: '40px', massive: '48px' }
  // 44px is exactly 44. Since it's a touch target, standard is 44-48.
  // We'll use h-[44px] but mapped via min-h-[44px] to avoid layout jank if text scales up
  const baseClasses = 'min-h-[44px] flex-row items-center justify-center rounded-xl px-lg';

  return (
    <AnimatedPressable
      disabled={isDisabled}
      testID="app-button"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`${baseClasses} ${bgClass} ${className}`}
      style={[animatedStyle, style]}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === 'primary' && !isDisabled
              ? (fullConfig.theme as any).colors.surface.light
              : '#60A5FA'
          }
        />
      ) : (
        <AppText className={`font-semibold ${textClass}`}>{label}</AppText>
      )}
    </AnimatedPressable>
  );
}
