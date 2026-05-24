import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './useProductivityViewModel';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type TodayPlanCardProps = {
  activeTab: Tab;
  todayPlan: string | null;
  setTodayPlan: (plan: string | null) => void;
};

export const TodayPlanCard: React.FC<TodayPlanCardProps> = ({
  activeTab,
  todayPlan,
  setTodayPlan,
}) => {
  if (activeTab !== 'today' || !todayPlan) return null;

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <AppText style={styles.title}>Today plan</AppText>
        <Pressable onPress={() => setTodayPlan(null)}>
          <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      <AppText style={styles.content}>{todayPlan}</AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: R.xl,
    backgroundColor: T.primary.surfaceLight,
    borderWidth: 1,
    borderColor: T.border.light,
    padding: S.lg,
    marginBottom: S.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: T.onSurface.light,
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    color: T.onSurface.mutedLight,
    marginTop: 8,
    lineHeight: 20,
  },
});
