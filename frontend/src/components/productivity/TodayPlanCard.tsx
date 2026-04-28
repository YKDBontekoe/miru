import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const S = theme.spacing;
const R = theme.borderRadius;

interface TodayPlanCardProps {
  todayPlan: string | null;
  setTodayPlan: (plan: string | null) => void;
}

export const TodayPlanCard = React.memo(({ todayPlan, setTodayPlan }: TodayPlanCardProps) => {
  if (!todayPlan) return null;

  return (
    <View className="rounded-xl bg-primary-soft border border-border p-6 mb-4">
      <View className="flex-row justify-between items-center">
        <AppText className="text-text font-bold text-[15px]">Today plan</AppText>
        <Pressable onPress={() => setTodayPlan(null)}>
          <Ionicons name="close" size={16} color={DESIGN_TOKENS.colors.muted} />
        </Pressable>
      </View>
      <AppText className="text-muted mt-2 leading-5">{todayPlan}</AppText>
    </View>
  );
});

TodayPlanCard.displayName = 'TodayPlanCard';
