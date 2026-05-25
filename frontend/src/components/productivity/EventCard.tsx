import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { CalendarEvent } from '@/core/models';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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
const S = theme.spacing;
const R = theme.borderRadius;

interface EventCardProps {
  event: CalendarEvent;
}

/**
 * A component to display a calendar event in the productivity lists.
 */
export const EventCard = ({ event }: EventCardProps) => {
  const { i18n } = useTranslation();

  return (
    <View className="flex-row items-center bg-white border border-gray-200 rounded-2xl p-4 mb-3 shadow-sm">
      <View className="w-8 h-8 rounded-2xl bg-blue-50 items-center justify-center mr-3">
        <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
      </View>
      <View className="flex-1">
        <AppText className="text-gray-900 font-bold text-[15px]">{event.title}</AppText>
        <AppText className="text-gray-500 mt-0.5 text-[13px]">
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
}
