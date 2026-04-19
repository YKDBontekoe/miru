import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';

/**
 * A container component representing a surface card on the home dashboard.
 * @param {object} props - The component props.
 * @param {React.ReactNode} props.children - The elements to be rendered inside the card.
 * @param {StyleProp<ViewStyle>} [props.style] - Optional styles to override or append to the default card styling.
 * @returns {React.ReactElement} The HomeSurfaceCard component.
 */
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
