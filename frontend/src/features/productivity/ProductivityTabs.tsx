import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { Tab } from './useProductivityViewModel';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type ProductivityTabsProps = {
  t: (key: string, options?: any) => string;
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
};

const TABS: readonly Tab[] = ['today', 'all', 'notes', 'tasks'];

export const ProductivityTabs: React.FC<ProductivityTabsProps> = ({
  t,
  activeTab,
  setActiveTab,
}) => {
  return (
    <View style={styles.tabsContainer}>
      {TABS.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => setActiveTab(tab)}
          style={({ pressed }) => [
            styles.tabButton,
            activeTab === tab && styles.tabButtonActive,
            pressed && activeTab !== tab && { opacity: 0.6 },
          ]}
        >
          <AppText style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
            {tab === 'today'
              ? t('productivity.today')
              : tab === 'all'
                ? t('productivity.all') || 'All'
                : tab === 'notes'
                  ? t('productivity.notes') || 'Notes'
                  : t('productivity.tasks') || 'Tasks'}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    paddingHorizontal: S.xl,
    paddingVertical: S.md,
    backgroundColor: T.background.light,
  },
  tabButton: {
    paddingVertical: S.sm,
    paddingHorizontal: S.md,
    borderRadius: R.full,
    marginRight: S.sm,
    backgroundColor: T.background.light,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: T.primary.DEFAULT,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.onSurface.mutedLight,
  },
  tabTextActive: {
    color: '#FFFFFF',
  },
});
