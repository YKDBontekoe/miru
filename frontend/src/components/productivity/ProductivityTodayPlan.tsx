import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './ProductivityTabs';

const S = theme.spacing;
const R = theme.borderRadius;

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
  transparent: 'transparent',
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
    <View style={styles.container}>
      <View style={styles.header}>
        <AppText style={styles.title}>Today plan</AppText>
        <Pressable onPress={onClose}>
          <Ionicons name="close" size={16} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      <AppText style={styles.content}>{todayPlan}</AppText>
    </View>
  );
});

ProductivityTodayPlan.displayName = 'ProductivityTodayPlan';

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
