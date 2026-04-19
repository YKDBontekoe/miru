import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';

/**
 * A hero component displaying the user's greeting and productivity summary on the home dashboard.
 * @param {object} props - The component props.
 * @param {string} props.greeting - The greeting text (e.g., "Good morning").
 * @param {string} props.firstName - The user's first name.
 * @param {string} props.dateText - The formatted current date.
 * @param {string} props.initials - The user's initials for their avatar.
 * @param {number} props.todayTaskCount - The number of tasks due today.
 * @param {number} props.completionRate - The user's task completion percentage.
 * @param {() => void} props.onSettingsPress - The callback function executed when the user's avatar is pressed.
 * @param {(key: string, opts?: Record<string, unknown>) => string} props.t - The translation function for localizing text.
 * @returns {React.ReactElement} The HomeHeroCard component.
 */
export function HomeHeroCard({
  greeting,
  firstName,
  dateText,
  initials,
  todayTaskCount,
  completionRate,
  onSettingsPress,
  t,
}: {
  greeting: string;
  firstName: string;
  dateText: string;
  initials: string;
  todayTaskCount: number;
  completionRate: number;
  onSettingsPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View
      style={{
        borderRadius: 28,
        backgroundColor: HOME_COLORS.deep,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 14,
        overflow: 'hidden',
        ...HOME_SHADOW,
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: '#2BA98A',
          opacity: 0.26,
          top: -90,
          right: -40,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: '#F0B470',
          opacity: 0.22,
          bottom: -44,
          left: -24,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText variant="bodySm" style={{ color: '#CDE9DF', fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: '#CDE9DF' }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#2D6A58',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: '#215445',
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
        >
          <AppText variant="caption" style={{ color: '#CDE9DF', marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: '#215445',
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
        >
          <AppText variant="caption" style={{ color: '#CDE9DF', marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}
