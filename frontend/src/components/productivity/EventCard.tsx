import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { CalendarEvent } from '@/core/models';
import { theme } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';

interface Props {
  event: CalendarEvent;
}

export const EventCard = React.memo(({ event }: Props) => {
  const { i18n } = useTranslation();
  const { C } = useTheme();

  return (
    <View
      className="flex-row items-center rounded-xl p-4 mb-4 border"
      style={[
        { backgroundColor: C.surface, borderColor: C.border },
        Platform.select({
          ios: theme.elevation.sm as any,
          android: { elevation: 1 },
          default: { elevation: 1 },
        })
      ]}
    >
      <View
        className="w-8 h-8 rounded-lg items-center justify-center mr-4"
        style={{ backgroundColor: C.primarySurface }}
      >
        <Ionicons name="calendar-outline" size={16} color={C.primary} />
      </View>
      <View className="flex-1">
        <AppText className="font-bold text-[15px]" style={{ color: C.text }}>{event.title}</AppText>
        <AppText className="mt-0.5 text-[13px]" style={{ color: C.muted }}>
          {new Intl.DateTimeFormat(i18n.language, {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            hour: event.is_all_day ? undefined : '2-digit',
            minute: event.is_all_day ? undefined : '2-digit',
          }).format(new Date(event.start_time))}
        </AppText>
      </View>
    </View>
  );
});

EventCard.displayName = 'EventCard';
