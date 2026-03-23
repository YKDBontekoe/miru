import React from 'react';
import { View, TouchableOpacity, ViewProps, StyleProp, ViewStyle } from 'react-native';

/**
 * Props for the AppCard component.
 *
 * @property {React.ReactNode} children - The content to be rendered inside the card.
 * @property {string} [className] - Optional NativeWind/Tailwind class string for additional styling.
 * @property {() => void} [onTap] - Optional callback function for when the card is pressed. If provided, the card is wrapped in a TouchableOpacity.
 * @property {boolean} [showBorder=true] - Whether to show a border around the card.
 * @property {StyleProp<ViewStyle>} [style] - Additional style object.
 */
export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Reusable card component styled with NativeWind.
 * Can act as a static container or a pressable element if `onTap` is provided.
 */
export function AppCard({
  children,
  className = '',
  onTap,
  showBorder = true,
  style,
  ...props
}: AppCardProps) {
  const baseClasses = 'bg-surface-light dark:bg-surface-dark rounded-md p-lg';
  const borderClasses = showBorder ? 'border border-border-light dark:border-border-dark' : '';

  const CardComponent = (
    <View className={`${baseClasses} ${borderClasses} ${className}`} style={style} {...props}>
      {children}
    </View>
  );

  if (onTap) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onTap}>
        {CardComponent}
      </TouchableOpacity>
    );
  }

  return CardComponent;
}
