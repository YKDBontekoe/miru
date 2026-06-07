import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';

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
