import React from 'react';
import { View } from 'react-native';

import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';

import { HOME_COLORS, HOME_SHADOW, HERO_COLORS } from '../homeTheme';

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
      className="rounded-[28px] px-[18px] py-[18px] mb-[14px] overflow-hidden"
      style={{
        backgroundColor: HOME_COLORS.deep,
        ...HOME_SHADOW,
      }}
    >
      <View
        className="absolute w-[180px] h-[180px] rounded-full opacity-25 -top-[90px] -right-[40px]"
        style={{
          backgroundColor: HERO_COLORS.circleGreen,
        }}
      />
      <View
        className="absolute w-[120px] h-[120px] rounded-full opacity-25 -bottom-[44px] -left-[24px]"
        style={{
          backgroundColor: HERO_COLORS.circleOrange,
        }}
      />

      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-2">
          <AppText variant="bodySm" style={{ color: HERO_COLORS.textLight, fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: HERO_COLORS.textWhite, fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: HERO_COLORS.textLight }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          className="w-[44px] h-[44px] rounded-[22px] items-center justify-center"
          style={{
            backgroundColor: HERO_COLORS.avatarBg,
          }}
        >
          <AppText variant="bodySm" style={{ color: HERO_COLORS.textWhite, fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View className="flex-row gap-2">
        <View
          className="flex-1 rounded-[14px] py-2.5 px-2.5"
          style={{
            backgroundColor: HERO_COLORS.statBg,
          }}
        >
          <AppText variant="caption" style={{ color: HERO_COLORS.textLight, marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: HERO_COLORS.textWhite, fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View
          className="flex-1 rounded-[14px] py-2.5 px-2.5"
          style={{
            backgroundColor: HERO_COLORS.statBg,
          }}
        >
          <AppText variant="caption" style={{ color: HERO_COLORS.textLight, marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: HERO_COLORS.textWhite, fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}
