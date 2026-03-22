import resolveConfig from 'tailwindcss/resolveConfig';
import tailwindConfig from '../../tailwind.config.js';

const fullConfig = resolveConfig(tailwindConfig);
const theme = fullConfig.theme as any;
import React, { useCallback } from 'react';
import { View, Pressable, ViewProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

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
  const baseClasses = 'bg-surface-light dark:bg-surface-dark rounded-md p-lg';
  const borderClasses = showBorder ? 'border border-border-light dark:border-border-dark' : '';

  // Apply Miru Elevation Scale
  const elevationStyle = Platform.select({
    ios: {
      shadowColor: 'theme.colors.onSurface.light',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
    },
    android: {
      elevation: 2,
    },
    default: {},
  });

  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    if (onTap) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  }, [onTap, scale]);

  const handlePressOut = useCallback(() => {
    if (onTap) {
      scale.value = withSpring(1, { damping: 15, stiffness: 300 });
    }
  }, [onTap, scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (onTap) {
    return (
      <AnimatedPressable
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[elevationStyle, animatedStyle, style]}
        className={`${baseClasses} ${borderClasses} ${className}`}
        {...props}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View
      className={`${baseClasses} ${borderClasses} ${className}`}
      style={[elevationStyle, style]}
      {...props}
    >
      {children}
    </View>
  );
}
