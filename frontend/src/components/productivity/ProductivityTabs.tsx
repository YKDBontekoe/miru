import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  surface: { highLight: DESIGN_TOKENS.colors.surfaceSoft, light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  transparent: 'transparent',
};
const S = theme.spacing;
const R = theme.borderRadius;

export type Tab = 'today' | 'all' | 'notes' | 'tasks';

export interface ProductivityTabsProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const TAB_LABELS: Record<Tab, string> = {
  today: 'productivity.today',
  all: 'productivity.all',
  notes: 'productivity.notes',
  tasks: 'productivity.tasks',
};

const TAB_FALLBACKS: Record<Tab, string> = {
  today: 'Today',
  all: 'All',
  notes: 'Notes',
  tasks: 'Tasks',
};

/**
 * Tabs component for the Productivity screen.
 * Allows switching between 'today', 'all', 'notes', and 'tasks' views.
 */
export const ProductivityTabs: React.FC<ProductivityTabsProps> = ({ activeTab, onTabChange }) => {
  const { t } = useTranslation();

  return (
    <View style={styles.tabsContainer}>
      {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
        <Pressable
          key={tab}
          accessibilityRole="tab"
          accessibilityState={{ selected: activeTab === tab }}
          onPress={() => onTabChange(tab)}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
            pressed && activeTab !== tab && { opacity: 0.6 },
          ]}
        >
          <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {t(TAB_LABELS[tab]) || TAB_FALLBACKS[tab]}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: T.surface.highLight,
    borderRadius: R.xl,
    padding: S.xs,
    marginHorizontal: S.xl,
    marginTop: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: T.border.light,
  },
  tabButton: {
    flex: 1,
    paddingVertical: S.sm,
    alignItems: 'center',
    borderRadius: R.lg,
    backgroundColor: T.transparent,
  },
  tabButtonActive: {
    backgroundColor: T.surface.light,
    ...theme.elevation.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: T.onSurface.mutedLight,
  },
  tabTextActive: {
    fontWeight: '700',
    color: T.onSurface.light,
  },
});
