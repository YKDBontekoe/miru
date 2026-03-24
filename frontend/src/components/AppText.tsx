import React from 'react';
import { Text, TextProps } from 'react-native';

export interface AppTextProps extends TextProps {
  variant?: 'h1' | 'h2' | 'h3' | 'body' | 'bodySm' | 'caption';
  color?: 'primary' | 'muted' | 'disabled' | 'brand' | 'white';
  className?: string;
}

// DOCS(miru-agent): needs documentation
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
      textClass = 'text-[32px] font-bold leading-[40px] tracking-tight';
      break;
    case 'h2':
      textClass = 'text-[24px] font-semibold leading-[32px] tracking-tight';
      break;
    case 'h3':
      textClass = 'text-[20px] font-medium leading-[28px]';
      break;
    case 'body':
      textClass = 'text-[16px] leading-[24px] tracking-[0.15px]';
      break;
    case 'bodySm':
      textClass = 'text-[14px] leading-[20px] tracking-[0.25px]';
      break;
    case 'caption':
      textClass = 'text-[12px] leading-[16px] tracking-[0.4px]';
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
    case 'white':
      colorClass = 'text-white';
      break;
  }

  return (
    <Text className={`${textClass} ${colorClass} ${className}`} {...props}>
      {children}
    </Text>
  );
}
