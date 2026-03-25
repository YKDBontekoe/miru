import React from 'react';
import { TouchableOpacity, ActivityIndicator, TouchableOpacityProps } from 'react-native';
import { AppText } from './AppText';

export interface AppButtonProps extends TouchableOpacityProps {
  label: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
  className?: string;
}

/**
 * A reusable button component styled with NativeWind.
 *
 * @param props - Component props extending standard Pressable props.
 * @param props.variant - The visual style variant of the button (e.g., primary, secondary, outline, text, ghost, danger).
 * @param props.size - The size of the button (e.g., sm, md, lg).
 * @param props.label - The text to display inside the button.
 * @param props.loading - Boolean indicating whether to show a loading spinner.
 * @param props.leftIcon - Optional React node to display before the text.
 * @param props.rightIcon - Optional React node to display after the text.
 * @param props.fullWidth - Boolean indicating if the button should span the full width of its container.
 * @param props.className - Additional class names to apply to the button container.
 * @param props.textClassName - Additional class names to apply to the text.
 */
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
