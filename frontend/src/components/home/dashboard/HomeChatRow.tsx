import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { HOME_COLORS } from '../homeTheme';
import { relativeTimeFromNow } from '../homeUtils';

export function HomeChatRow({
  room,
  onPress,
  t,
}: {
  room: ChatRoom;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      className="flex-row items-center px-3 py-3 rounded-2xl mb-2"
      style={{
        backgroundColor: HOME_COLORS.softSurface,
      }}
    >
      <View
        className="w-[34px] h-[34px] rounded-[11px] items-center justify-center mr-[10px]"
        style={{
          backgroundColor: HOME_COLORS.primarySoft,
        }}
      >
        <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View className="flex-1 pr-2">
        <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: HOME_COLORS.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="caption" style={{ color: HOME_COLORS.muted, marginBottom: 2 }}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
      </View>
    </ScalePressable>
  );
}
