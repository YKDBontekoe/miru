import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { ChatRoom } from '@/core/models';
import { HOME_COLORS } from './homeTheme';
import { relativeTimeFromNow } from './homeUtils';

/**
 * A row component displaying a recent chat room on the home dashboard.
 * @param {object} props - The component props.
 * @param {ChatRoom} props.room - The chat room object to display.
 * @param {() => void} props.onPress - The callback function executed when the row is pressed.
 * @param {(key: string, opts?: Record<string, unknown>) => string} props.t - The translation function for localizing text.
 * @returns {React.ReactElement} The HomeChatRow component.
 */
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: HOME_COLORS.softSurface,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: HOME_COLORS.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
          {room.name?.[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: HOME_COLORS.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="caption" style={{ color: HOME_COLORS.muted, marginBottom: 2 }}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
      </View>
    </ScalePressable>
  );
}
