import React from 'react';
import { Text, TextProps } from 'react-native';

export interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
  color?: 'primary' | 'muted' | 'disabled' | 'brand';
  className?: string;
}

/**
 * A core text component for rendering typographic elements across the app.
 *
 * @param props - Component props extending standard Text props.
 * @param props.variant - The typography style variant (e.g., h1, h2, h3, h4, body, footnote, caption, overline).
 * @param props.weight - The font weight to apply (e.g., regular, medium, semibold, bold).
 * @param props.color - The text color token to apply.
 * @param props.align - The text alignment.
 * @param props.className - Additional custom class names.
 */
export function AppText({
  children,
  variant = 'body',
  color = 'primary',
  className = '',
  ...props
}: AppTextProps) {
  let textClass = '';

  switch (variant) {
    case 'h1':
      textClass = 'text-3xl font-bold';
      break;
    case 'h2':
      textClass = 'text-2xl font-semibold';
      break;
    case 'h3':
      textClass = 'text-xl font-medium';
      break;
    case 'body':
      textClass = 'text-base';
      break;
    case 'bodySm':
      textClass = 'text-sm';
      break;
    case 'caption':
      textClass = 'text-xs';
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

  return (
    <Text className={`${textClass} ${colorClass} ${className}`} {...props}>
      {children}
    </Text>
  );
}
