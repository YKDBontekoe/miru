import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS } from './homeTheme';

/**
 * A square-shaped tile widget used on the home dashboard to display quick actions.
 * @param {object} props - The component props.
 * @param {string} props.label - The text label displayed below the icon.
 * @param {React.ComponentProps<typeof Ionicons>['name']} props.icon - The name of the Ionicons icon to display.
 * @param {() => void} props.onPress - The callback function executed when the tile is pressed.
 * @returns {React.ReactElement} The HomeActionTile component.
 */
export function HomeActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={{
        width: '48.5%',
        borderWidth: 1,
        borderColor: HOME_COLORS.border,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: HOME_COLORS.softSurface,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: HOME_COLORS.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={18} color={HOME_COLORS.primary} />
      </View>
      <AppText variant="bodySm" style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}
