import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
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
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppText style={styles.title}>Today plan</AppText>
        <Pressable onPress={() => setTodayPlan(null)}>
          <Ionicons name="close" size={16} color={DESIGN_TOKENS.colors.muted} />
        </Pressable>
      </View>
      <AppText style={styles.content}>{todayPlan}</AppText>
    </View>
  );
});

TodayPlanCard.displayName = 'TodayPlanCard';

const styles = StyleSheet.create({
  container: {
    borderRadius: R.xl,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    padding: S.lg,
    marginBottom: S.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    color: DESIGN_TOKENS.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  content: {
    color: DESIGN_TOKENS.colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
});
