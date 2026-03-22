import React from 'react';
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { AppText } from './AppText';

export interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

export function AppButton({
  label,
  variant = 'primary',
  isLoading = false,
  disabled,
  className = '',
  ...props
}: AppButtonProps) {
  const isDisabled = disabled || isLoading;

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

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={isDisabled}
      testID="app-button"
      className={`h-[44px] flex-row items-center justify-center rounded-xl px-lg ${bgClass} ${className}`}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={variant === 'primary' && !isDisabled ? 'white' : '#60A5FA'} />
      ) : (
        <AppText className={`font-semibold ${textClass}`}>{label}</AppText>
      )}
    </TouchableOpacity>
  );
}
