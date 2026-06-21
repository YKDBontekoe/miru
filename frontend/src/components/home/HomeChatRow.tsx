import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { HOME_COLORS } from '@/components/home/homeTheme';
import { relativeTimeFromNow } from '@/components/home/homeUtils';

export const HomeChatRow = ({
  room,
  onPress,
  t,
}: {
  room: ChatRoom;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) => {
  return (
    <ScalePressable
      onPress={onPress}
      className="flex-row items-center px-3 py-3 rounded-2xl mb-2"
      style={{
        backgroundColor: HOME_COLORS.softSurface,
      }}
    >
      <View
        className="w-[34px] h-[34px] rounded-[11px] items-center justify-center mr-2.5"
        style={{
          backgroundColor: HOME_COLORS.primarySoft,
        }}
      >
        <AppText variant="bodySm" className="font-extrabold" style={{ color: HOME_COLORS.primary }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View className="flex-1 pr-2">
        <AppText variant="bodySm" numberOfLines={1} className="font-bold" style={{ color: HOME_COLORS.text }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: HOME_COLORS.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="caption" className="mb-0.5" style={{ color: HOME_COLORS.muted }}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
      </View>
    </ScalePressable>
  );
};
