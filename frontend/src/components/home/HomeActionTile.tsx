import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS } from '@/components/home/homeTheme';

export const HomeActionTile = ({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      className="w-[48.5%] border rounded-[18px] py-[14px] px-3 mb-2.5"
      style={{
        borderColor: HOME_COLORS.border,
        backgroundColor: HOME_COLORS.softSurface,
      }}
    >
      <View
        className="w-[34px] h-[34px] rounded-xl items-center justify-center mb-2"
        style={{
          backgroundColor: HOME_COLORS.primarySoft,
        }}
      >
        <Ionicons name={icon} size={18} color={HOME_COLORS.primary} />
      </View>
      <AppText variant="bodySm" className="font-bold" style={{ color: HOME_COLORS.text }}>
        {label}
      </AppText>
    </ScalePressable>
  );
};
