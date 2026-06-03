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
      style={[
        {
          backgroundColor: HOME_COLORS.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: HOME_COLORS.border,
          padding: 16,
          marginBottom: 14,
          ...HOME_SHADOW,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}
