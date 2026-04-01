import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { ChatRoom } from '../../core/models';
import { theme } from '../../core/theme';

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
    <ScalePressable onPress={onPress} style={styles.container}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isDark
              ? `${theme.colors.primary.DEFAULT}20` // 20% opacity for dark mode
              : theme.colors.primary.surfaceLight,
          },
        ]}
      >
        <AppText
          style={[
            styles.iconText,
            { color: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT },
          ]}
        >
          {initial}
        </AppText>
      </View>
      <View style={styles.textContainer}>
        <AppText
          variant="bodySm"
          style={[
            styles.title,
            { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light },
          ]}
          numberOfLines={1}
        >
          {room.name}
        </AppText>
        <AppText
          variant="caption"
          style={{ color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight }}
          numberOfLines={1}
        >
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={styles.metaContainer}>
        <AppText
          variant="caption"
          style={[
            styles.timeText,
            { color: isDark ? theme.colors.onSurface.disabledDark : theme.colors.onSurface.disabledLight },
          ]}
        >
          {relativeTimeStr}
        </AppText>
        <Ionicons
          name="chevron-forward"
          size={13}
          color={isDark ? theme.colors.onSurface.disabledDark : theme.colors.onSurface.disabledLight}
        />
      </View>
    </ScalePressable>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: theme.spacing.md,
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md,
  },
  iconText: {
    fontSize: 15,
    fontWeight: '700',
  },
  textContainer: {
    flex: 1,
    marginEnd: theme.spacing.sm,
  },
  title: {
    fontWeight: '600',
    marginBottom: theme.spacing.xxs,
  },
  metaContainer: {
    alignItems: 'flex-end',
  },
  timeText: {
    marginBottom: theme.spacing.xs,
  },
});
