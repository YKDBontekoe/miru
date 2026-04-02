import React from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-row justify-between items-center mb-6">
      <AppText variant="h3" className={isDark ? 'text-onSurface-dark' : 'text-onSurface-light'}>
        {title}
      </AppText>
      {actionLabel && onAction && (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" className="text-primary-DEFAULT">
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </View>
  );
}
