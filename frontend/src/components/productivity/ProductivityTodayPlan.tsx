import React from 'react';
import { View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './ProductivityTabs';

const T = {
  onSurface: {
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
};

interface Props {
  activeTab: Tab;
  todayPlan: string | null;
  onClose: () => void;
}

export const ProductivityTodayPlan = React.memo(({
  activeTab,
  todayPlan,
  onClose,
}: Props) => {
  if (activeTab !== 'today' || !todayPlan) {
    return null;
  }

  return (
    <View className="rounded-xl bg-primary/10 border border-border p-4 mb-3">
      <View className="flex-row justify-between items-center">
        <AppText className="text-text font-bold text-[15px]">Today plan</AppText>
        <Pressable
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Dismiss today plan"
        >
          <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      <AppText className="text-muted mt-2 leading-[20px]">{todayPlan}</AppText>
    </View>
  );
});

ProductivityTodayPlan.displayName = 'ProductivityTodayPlan';
