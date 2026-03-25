import React from 'react';
import { Text, TextProps } from 'react-native';
import { useColorScheme } from 'nativewind';
import { theme } from '../core/theme';

export interface AppTextProps extends TextProps {
  variant?: keyof typeof theme.typography;
  color?: 'primary' | 'muted' | 'disabled' | 'brand';
  className?: string;
  style?: TextProps['style'];
}

// DOCS(miru-agent): needs documentation
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
      case 'primary':
        return { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light };
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
