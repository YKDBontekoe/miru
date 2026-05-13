import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';

import { useTheme } from '@/hooks/useTheme';
import { useTranslation } from 'react-i18next';

interface TodayPlanBannerProps {
  todayPlan: string | null;
  onDismiss: () => void;
}

export const TodayPlanBanner = React.memo(function TodayPlanBanner({
  todayPlan,
  onDismiss,
}: TodayPlanBannerProps) {
  const { C } = useTheme();
  const { t } = useTranslation();

  if (!todayPlan) return null;

  return (
    <View
      className="rounded-xl border p-6 mb-4"
      style={{ backgroundColor: C.primarySurface, borderColor: C.border }}
    >
      <View className="flex-row justify-between items-center">
        <AppText className="font-bold text-[15px]" style={{ color: C.text }}>{t('todayPlan', 'Today plan')}</AppText>
        <Pressable onPress={onDismiss} accessibilityRole='button' accessibilityLabel='Close today plan banner'>
          <Ionicons name="close" size={16} color={C.subtext} />
        </Pressable>
      </View>
      <AppText className="mt-2 leading-5" style={{ color: C.subtext }}>{todayPlan}</AppText>
    </View>
  );
});
