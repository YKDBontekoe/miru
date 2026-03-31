import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { ChatRoom } from '../../core/models';

const C = {
  primaryFaint: '#EEF4FF',
  primary: '#2563EB',
  text: '#0A0E2E',
  muted: '#606490',
  faint: '#B4BBDE',
};

export const HomeRecentChatRow = React.memo(function HomeRecentChatRow({
  room,
  onPress,
  isLast,
}: {
  room: ChatRoom;
  onPress: () => void;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const initial = room.name[0]?.toUpperCase() ?? '?';

  const relativeTimeStr = React.useMemo(() => {
    const diff = Date.now() - new Date(room.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t('home.time.minutes_ago_one', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('home.time.hours_ago_one', { count: hrs });
    return t('home.time.days_ago_one', { count: Math.floor(hrs / 24) });
  }, [t, room.updated_at]);

  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: C.primaryFaint,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>{initial}</AppText>
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }} numberOfLines={1}>
          {room.name}
        </AppText>
        <AppText style={{ fontSize: 12, color: C.muted, marginTop: 2 }} numberOfLines={1}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText style={{ fontSize: 11, color: C.faint, marginBottom: 4 }}>
          {relativeTimeStr}
        </AppText>
        <Ionicons name="chevron-forward" size={13} color={C.faint} />
      </View>
    </ScalePressable>
  );
});
