import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';

const C = {
  primaryFaint: '#EEF4FF',
  primaryLight: '#DBEAFE',
  primary: '#2563EB',
  text: '#0A0E2E',
};

export function HomeQuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <ScalePressable onPress={onPress} style={{ width: '48%', marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: C.primaryFaint,
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
            backgroundColor: C.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons name={icon} size={22} color={C.primary} />
        </View>
        <AppText
          style={{ fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}
