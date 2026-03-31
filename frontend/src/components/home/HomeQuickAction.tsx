import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';

export function HomeQuickAction({
  icon,
  label,
  onPress,
  color = '#2563EB',
  bgColor = '#EEF4FF',
  iconBgColor = '#DBEAFE',
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  color?: string;
  bgColor?: string;
  iconBgColor?: string;
}) {
  return (
    <ScalePressable onPress={onPress} style={{ width: '48%', marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: bgColor,
          borderRadius: 20,
          paddingVertical: 20,
          paddingHorizontal: 12,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            backgroundColor: iconBgColor,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons name={icon} size={22} color={color} />
        </View>
        <AppText
          style={{ fontSize: 13, fontWeight: '600', color: color, textAlign: 'center' }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}
