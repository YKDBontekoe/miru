import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS } from '@/components/home/homeTheme';

export const HomeSectionHeader = ({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) => {
  return (
    <View className="flex-row justify-between items-center mb-3">
      <AppText variant="h3" className="font-bold" style={{ color: HOME_COLORS.text }}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" className="font-bold" style={{ color: HOME_COLORS.primary }}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
};
