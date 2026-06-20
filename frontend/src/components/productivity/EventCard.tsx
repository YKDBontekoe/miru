import React from 'react';

import { AppText } from '../AppText';
import { Ionicons } from '@expo/vector-icons';
import { CalendarEvent } from '@/core/models';
import { useTranslation } from 'react-i18next';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { View } from 'react-native';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};


interface EventCardProps {
  event: CalendarEvent;
}

export const EventCard = React.memo(({ event }: EventCardProps) => {
  const { i18n } = useTranslation();

  return (
    <View className="flex-row items-center bg-white border border-[#DDE8E0] rounded-xl p-4 mb-4 shadow-sm">
      <View className="w-8 h-8 rounded-lg bg-[#ECF5F0] items-center justify-center mr-4">
        <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
      </View>
      <View className="flex-1">
        <AppText className="text-[#13251C] font-bold text-[15px]">{event.title}</AppText>
        <AppText className="text-[#5A7467] mt-0.5 text-[13px]">
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
