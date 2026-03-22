import * as React from 'react';
import { Text, TextProps, Platform } from 'react-native';

export interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
  color?: 'primary' | 'muted' | 'disabled' | 'brand';
  className?: string;
}

export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
  style,
  ...props
}: AppTextProps) {
  let textClass = '';
  let variantStyle: any = {};

  // Standardize text components. Add subtle letterSpacing and lineHeight for "Flat UI" syndrome
  switch (variant) {
    case 'h1':
      textClass = 'text-3xl font-bold';
      variantStyle = { letterSpacing: -0.5, lineHeight: 36 };
      break;
    case 'h2':
      textClass = 'text-2xl font-semibold';
      variantStyle = { letterSpacing: -0.3, lineHeight: 32 };
      break;
    case 'h3':
      textClass = 'text-xl font-medium';
      variantStyle = { letterSpacing: -0.2, lineHeight: 28 };
      break;
    case 'body':
      textClass = 'text-base';
      variantStyle = { letterSpacing: 0.2, lineHeight: 24 }; // fixed readability
      break;
    case 'bodySm':
      textClass = 'text-sm';
      variantStyle = { letterSpacing: 0.1, lineHeight: 20 };
      break;
    case 'caption':
      textClass = 'text-xs';
      variantStyle = { letterSpacing: 0.1, lineHeight: 16 };
      break;
  }

  let colorClass = '';
  switch (color) {
    case 'primary':
      colorClass = 'text-onSurface-light dark:text-onSurface-dark';
      break;
    case 'muted':
      colorClass = 'text-onSurface-mutedLight dark:text-onSurface-mutedDark';
      break;
    case 'disabled':
      colorClass = 'text-onSurface-disabledLight dark:text-onSurface-disabledDark';
      break;
    case 'brand':
      colorClass = 'text-primary';
      break;
  }

  // Handle platform specifics for typography
  const platformStyle = Platform.select({
    ios: {
      fontFamily: 'System', // Example, if custom font isn't loaded
    },
    android: {
      fontFamily: 'Roboto', // Example, if custom font isn't loaded
    },
  });

  return (
    <Text
      className={`${textClass} ${colorClass} ${className}`}
      style={[variantStyle, platformStyle, style]}
      {...props as any}
    >
      {children}
    </Text>
  );
}
