import React from 'react';
import { Text, TextProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { theme } from '../core/theme';

export interface AppTextProps extends TextProps {
  variant?: keyof typeof theme.typography;
  color?: 'primary' | 'muted' | 'disabled' | 'brand' | 'white';
  className?: string;
  style?: TextProps['style'];
}

/**
 * A themed wrapper around React Native's Text component.
 *
 * Automatically applies typography scales and text colors based on the current
 * color scheme (light/dark mode) and Miru design tokens.
 *
 * @param props.children - The text content to display.
 * @param props.variant - The typography variant from the theme (e.g., 'body', 'h1', 'label').
 *                        Defaults to 'body'.
 * @param props.color - The semantic text color to apply ('primary', 'muted', 'disabled',
 *                      or 'brand').
 * @param props.className - Optional NativeWind class string for additional styling.
 * @param props.style - Optional React Native Text style overrides.
 */
export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
  style,
  ...props
}: AppTextProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const getTextColorStyle = () => {
    switch (color) {
      case 'muted':
        return {
          color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
        };
      case 'disabled':
        return {
          color: isDark
            ? theme.colors.onSurface.disabledDark
            : theme.colors.onSurface.disabledLight,
        };
      case 'brand':
        return { color: theme.colors.primary.DEFAULT };
      case 'white':
        return { color: theme.colors.white };
      case 'primary':
      default:
        return { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light };
    }
  };

  return (
    <Text
      className={className}
      style={[theme.typography[variant], getTextColorStyle(), style]}
      {...props}
    >
      {children}
    </Text>
  );
}
