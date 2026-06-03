import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';

import { HOME_COLORS, HOME_SHADOW } from '../homeTheme';

export function HomeSurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className="rounded-[24px] border p-4 mb-[14px]"
      style={[
        {
          backgroundColor: HOME_COLORS.surface,
          borderColor: HOME_COLORS.border,
          ...HOME_SHADOW,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
