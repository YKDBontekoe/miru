import React from 'react';
import { View, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { CalendarEvent } from '@/core/models';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
  transparent: 'transparent',
};

interface Props {
  event: CalendarEvent;
}

export const EventCard = React.memo(({ event }: Props) => {
  const { i18n } = useTranslation();

  return (
    <View
      className="flex-row items-center bg-surface border border-border rounded-xl p-lg mb-md"
      style={Platform.select({
        ios: theme.elevation.sm as any,
        android: { elevation: 1 },
        default: { elevation: 1 },
      })}
    >
      <View className="w-8 h-8 rounded-lg bg-primarySoft items-center justify-center mr-md">
        <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
      </View>
      <View className="flex-1">
        <AppText className="text-text font-bold text-[15px]">{event.title}</AppText>
        <AppText className="text-muted mt-[2px] text-[13px]">
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
