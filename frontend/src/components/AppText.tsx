import React from 'react';
import { Text, TextProps, StyleSheet } from 'react-native';
import { theme } from '../core/theme';

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
  let variantStyle: any = {};

  switch (variant) {
    case 'h1':
      variantStyle = styles.h1;
      break;
    case 'h2':
      variantStyle = styles.h2;
      break;
    case 'h3':
      variantStyle = styles.h3;
      break;
    case 'body':
      variantStyle = styles.body;
      break;
    case 'bodySm':
      variantStyle = styles.bodySm;
      break;
    case 'caption':
      variantStyle = styles.caption;
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
    <Text {...props} className={`${colorClass} ${className}`} style={[variantStyle, style]}>
      {children}
    </Text>
  );
}

const styles = StyleSheet.create({
  h1: {
    fontSize: theme.typography.h1.fontSize,
    fontWeight: theme.typography.h1.fontWeight,
    lineHeight: theme.typography.h1.lineHeight,
    letterSpacing: theme.typography.h1.letterSpacing,
  },
  h2: {
    fontSize: theme.typography.h2.fontSize,
    fontWeight: theme.typography.h2.fontWeight,
    lineHeight: theme.typography.h2.lineHeight,
    letterSpacing: theme.typography.h2.letterSpacing,
  },
  h3: {
    fontSize: theme.typography.h3.fontSize,
    fontWeight: theme.typography.h3.fontWeight,
    lineHeight: theme.typography.h3.lineHeight,
    letterSpacing: theme.typography.h3.letterSpacing,
  },
  body: {
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    letterSpacing: theme.typography.body.letterSpacing,
  },
  bodySm: {
    fontSize: theme.typography.bodySm.fontSize,
    lineHeight: theme.typography.bodySm.lineHeight,
    letterSpacing: theme.typography.bodySm.letterSpacing,
  },
  caption: {
    fontSize: theme.typography.caption.fontSize,
    lineHeight: theme.typography.caption.lineHeight,
    letterSpacing: theme.typography.caption.letterSpacing,
  },
});
