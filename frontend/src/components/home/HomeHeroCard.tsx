import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { HOME_COLORS, HOME_SHADOW } from '@/components/home/homeTheme';

export const HomeHeroCard = ({
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
}) => {
  return (
    <View
      className="rounded-[28px] px-[18px] py-[18px] mb-[14px] overflow-hidden"
      style={{
        backgroundColor: HOME_COLORS.deep,
        ...HOME_SHADOW,
      }}
    >
      <View
        className="absolute w-[180px] h-[180px] rounded-full opacity-[0.26] -top-[90px] -right-[40px]"
        style={{
          backgroundColor: '#2BA98A',
        }}
      />
      <View
        className="absolute w-[120px] h-[120px] rounded-full opacity-[0.22] -bottom-[44px] -left-[24px]"
        style={{
          backgroundColor: '#F0B470',
        }}
      />

      <View className="flex-row justify-between items-start mb-4">
        <View className="flex-1 pr-2">
          <AppText variant="bodySm" className="font-semibold" style={{ color: '#CDE9DF' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} className="font-bold" style={{ color: '#FFFFFF' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: '#CDE9DF' }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          className="w-11 h-11 rounded-[22px] items-center justify-center"
          style={{
            backgroundColor: '#2D6A58',
          }}
        >
          <AppText variant="bodySm" className="font-bold" style={{ color: '#FFFFFF' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View className="flex-row gap-2">
        <View
          className="flex-1 rounded-[14px] py-2.5 px-2.5"
          style={{
            backgroundColor: '#215445',
          }}
        >
          <AppText variant="caption" className="mb-0.5" style={{ color: '#CDE9DF' }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" className="font-bold" style={{ color: '#FFFFFF' }}>
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
            backgroundColor: '#215445',
          }}
        >
          <AppText variant="caption" className="mb-0.5" style={{ color: '#CDE9DF' }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" className="font-bold" style={{ color: '#FFFFFF' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
};
