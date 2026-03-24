import React, { useCallback } from 'react';
import { View, Pressable, ViewProps, StyleProp, ViewStyle, Platform } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

// DOCS(miru-agent): needs documentation
export function AppCard({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  ...props
}: AppCardProps) {
  const baseClasses = 'bg-surface-light dark:bg-surface-dark rounded-xl p-lg';
  const borderClasses = showBorder ? 'border border-border-light dark:border-border-dark' : '';

  const shadowProps = Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
  });

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
      opacity: 1 - pressed.value * 0.1,
    };
  });

  const content = (
    <View
      className={`${baseClasses} ${borderClasses} ${className}`}
      style={[style, shadowProps]}
      {...props}
    >
      {children}
    </View>
  );

  if (onTap) {
    return (
      <AnimatedPressable
        onPress={onTap}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={animatedStyle}
      >
        {content}
      </AnimatedPressable>
    );
  }

  return content;
}
