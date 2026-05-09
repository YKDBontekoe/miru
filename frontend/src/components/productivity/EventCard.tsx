import React, { useMemo } from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { CalendarEvent } from '../../core/models';
import { theme } from '../../core/theme';
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
const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  event: CalendarEvent;
}

export const EventCard = React.memo(({ event }: Props) => {
  const { i18n } = useTranslation();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        eventCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: T.surface.light,
          borderWidth: 1,
          borderColor: T.border.light,
          borderRadius: R.xl,
          padding: S.lg,
          marginBottom: S.md,
          ...Platform.select({
            ios: theme.elevation.sm as any,
            android: { elevation: 1 },
            default: { elevation: 1 },
          }),
        },
        eventIcon: {
          width: 32,
          height: 32,
          borderRadius: R.lg,
          backgroundColor: T.primary.surfaceLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: S.md,
        },
        eventBody: {
          flex: 1,
        },
        eventTitle: {
          color: T.onSurface.light,
          fontWeight: '700',
          fontSize: 15,
        },
        eventMeta: {
          color: T.onSurface.mutedLight,
          marginTop: 2,
          fontSize: 13,
        },
      }),
    []
  );

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventIcon}>
        <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
      </View>
      <View style={styles.eventBody}>
        <AppText style={styles.eventTitle}>{event.title}</AppText>
        <AppText style={styles.eventMeta}>
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
