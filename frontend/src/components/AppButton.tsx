import React from 'react';
import { Pressable, ActivityIndicator, PressableProps, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, AnimatedStyle } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { AppText } from './AppText';
import { theme } from '../core/theme';

export interface AppButtonProps extends Omit<PressableProps, 'style'> {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
  style?: StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>;
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
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const isDisabled = disabled || isLoading;

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (!isDisabled) {
      scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const getContainerStyle = () => {
    const baseStyle = styles.container;

    switch (variant) {
      case 'primary':
        if (isDisabled) {
          return [
            baseStyle,
            {
              backgroundColor: isDark
                ? theme.colors.surface.highestDark
                : theme.colors.surface.highestLight,
            },
          ];
        }
        return [baseStyle, { backgroundColor: theme.colors.primary.DEFAULT }];
      case 'secondary':
        return [
          baseStyle,
          {
            backgroundColor: isDark
              ? theme.colors.surface.highDark
              : theme.colors.surface.highLight,
          },
        ];
      case 'outline':
        return [
          baseStyle,
          styles.outline,
          { borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light },
        ];
      case 'ghost':
        return [baseStyle, styles.ghost];
      default:
        return baseStyle;
    }
  };

  const getTextColorStyle = () => {
    switch (variant) {
      case 'primary':
        if (isDisabled) {
          return {
            color: isDark
              ? theme.colors.onSurface.disabledDark
              : theme.colors.onSurface.disabledLight,
          };
        }
        return { color: theme.colors.white };
      case 'secondary':
      case 'outline':
        return { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light };
      case 'ghost':
        return { color: theme.colors.primary.DEFAULT };
      default:
        return { color: theme.colors.white };
    }
  };

  return (
    <AnimatedPressable
      disabled={isDisabled}
      testID="app-button"
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={className}
      style={[getContainerStyle(), animatedStyle, style] as StyleProp<AnimatedStyle<StyleProp<ViewStyle>>>}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator
          color={
            variant === 'primary' && !isDisabled ? theme.colors.white : theme.colors.primary.light
          }
        />
      ) : (
        <AppText style={[styles.text, getTextColorStyle()]}>{label}</AppText>
      )}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: theme.spacing.massive, // Improved touch target height
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.xl,
    paddingHorizontal: theme.spacing.lg,
  },
  outline: {
    backgroundColor: theme.colors.transparent,
    borderWidth: 1,
  },
  ghost: {
    backgroundColor: theme.colors.transparent,
  },
  text: {
    ...theme.typography.body,
    fontWeight: '600',
  },
});
