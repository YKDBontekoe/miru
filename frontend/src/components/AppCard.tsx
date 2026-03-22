import React from 'react';
import { View, TouchableOpacity, ViewProps, StyleProp, ViewStyle } from 'react-native';

export interface AppCardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  onTap?: () => void;
  showBorder?: boolean;
  style?: StyleProp<ViewStyle>;
}

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
