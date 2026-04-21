import React, { useMemo } from 'react';
import { View, StyleSheet, Platform, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { CalendarEvent } from '../../core/models';
import { theme } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';

const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  event: CalendarEvent;
}

/**
 * Renders a calendar event as a card widget.
 * Displays the event's title and its formatted start time.
 *
 * @param {Props} props - The component props.
 * @param {CalendarEvent} props.event - The calendar event object to display.
 */
export const EventCard = React.memo(({ event }: Props) => {
  const { i18n } = useTranslation();
  const { C } = useTheme();

  const styles = useMemo(
    () =>
      StyleSheet.create({
        eventCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderWidth: 1,
          borderColor: C.border,
          borderRadius: R.xl,
          padding: S.lg,
          marginBottom: S.md,
          ...Platform.select({
            ios: theme.elevation.sm as ViewStyle,
            android: { elevation: 1 },
            default: { elevation: 1 },
          }),
        },
        eventIcon: {
          width: 32,
          height: 32,
          borderRadius: R.lg,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: S.md,
        },
        eventBody: {
          flex: 1,
        },
        eventTitle: {
          color: C.text,
          fontWeight: '700',
          fontSize: 15,
        },
        eventMeta: {
          color: C.muted,
          marginTop: 2,
          fontSize: 13,
        },
      }),
    [C.border, C.muted, C.primarySurface, C.surface, C.text]
  );

  const formatter = useMemo(() => {
    return new Intl.DateTimeFormat(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: event.is_all_day ? undefined : '2-digit',
      minute: event.is_all_day ? undefined : '2-digit',
    });
  }, [i18n.language, event.is_all_day]);

  const date = new Date(event.start_time);
  const formattedTime = isNaN(date.getTime()) ? 'Unknown time' : formatter.format(date);

  return (
    <View style={styles.eventCard}>
      <View style={styles.eventIcon}>
        <Ionicons name="calendar-outline" size={16} color={C.primary} />
      </View>
      <View style={styles.eventBody}>
        <AppText style={styles.eventTitle}>{event.title}</AppText>
        <AppText style={styles.eventMeta}>{formattedTime}</AppText>
      </View>
    </View>
  );
});

EventCard.displayName = 'EventCard';
