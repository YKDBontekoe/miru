import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { ChatRoom } from '@/core/models';
import { theme } from '@/core/theme';

export const HomeRecentChatRow = React.memo(function HomeRecentChatRow({
  room,
  onPress,
}: {
  room: ChatRoom;
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const initial = room.name[0]?.toUpperCase() ?? '?';

  const relativeTimeStr = React.useMemo(() => {
    const diff = Math.max(0, Date.now() - new Date(room.updated_at).getTime());
    const mins = Math.floor(diff / 60000);
    if (mins === 0) return t('home.time.just_now', 'just now');
    if (mins < 60) return t('home.time.minutes_ago', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('home.time.hours_ago', { count: hrs });
    return t('home.time.days_ago', { count: Math.floor(hrs / 24) });
  }, [t, room.updated_at]);

  return (
    <ScalePressable onPress={onPress} className="flex-row items-center py-4">
      <View
        className={`w-[42px] h-[42px] rounded-md items-center justify-center me-4 ${
          isDark ? 'bg-primary-DEFAULT/20' : 'bg-primary-surfaceLight'
        }`}
      >
        <AppText
          className={`text-[15px] font-bold ${
            isDark ? 'text-primary-light' : 'text-primary-DEFAULT'
          }`}
        >
          {initial}
        </AppText>
      </View>
      <View className="flex-1 me-3">
        <AppText
          variant="bodySm"
          className={`font-semibold mb-1 ${
            isDark ? 'text-onSurface-dark' : 'text-onSurface-light'
          }`}
          numberOfLines={1}
        >
          {room.name}
        </AppText>
        <AppText
          variant="caption"
          className={isDark ? 'text-onSurface-mutedDark' : 'text-onSurface-mutedLight'}
          numberOfLines={1}
        >
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View className="items-end">
        <AppText
          variant="caption"
          className={`mb-1 ${
            isDark ? 'text-onSurface-disabledDark' : 'text-onSurface-disabledLight'
          }`}
        >
          {relativeTimeStr}
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={13}
          color={
            isDark ? theme.colors.onSurface.disabledDark : theme.colors.onSurface.disabledLight
          }
        />
      </View>
    </ScalePressable>
  );
});
