import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
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

interface TodayPlanCardProps {
  todayPlan: string | null;
  setTodayPlan: (plan: string | null) => void;
}

export function TodayPlanCard({ todayPlan, setTodayPlan }: TodayPlanCardProps) {
  const { t } = useTranslation();

  if (!todayPlan) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.title}>{t('productivity.today_plan') || 'Today plan'}</AppText>
        <Pressable onPress={() => setTodayPlan(null)}>
          <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      <AppText style={styles.content}>{todayPlan}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
