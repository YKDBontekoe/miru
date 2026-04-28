import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const S = theme.spacing;
const R = theme.borderRadius;

export type Tab = 'today' | 'all' | 'notes' | 'tasks';

interface ProductivityTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
}

const TABS: Tab[] = ['today', 'all', 'notes', 'tasks'];

export const ProductivityTabs = React.memo(({ activeTab, setActiveTab }: ProductivityTabsProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.tabsContainer}>
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabButton,
              isActive && styles.tabButtonActive,
              pressed && !isActive && { opacity: 0.6 },
            ]}
          >
            <AppText style={[styles.tabText, isActive && styles.tabTextActive]}>
              {tab === 'today'
                ? t('productivity.today') || 'Today'
                : tab === 'all'
                  ? t('productivity.all') || 'All'
                  : tab === 'notes'
                    ? t('productivity.notes') || 'Notes'
                    : t('productivity.tasks') || 'Tasks'}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
});

ProductivityTabs.displayName = 'ProductivityTabs';

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    borderRadius: R.xl,
    padding: S.xs,
    marginHorizontal: S.xl,
    marginTop: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  tabButton: {
    flex: 1,
    paddingVertical: S.sm,
    alignItems: 'center',
    borderRadius: R.lg,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    backgroundColor: DESIGN_TOKENS.colors.surface,
    ...theme.elevation.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: DESIGN_TOKENS.colors.muted,
  },
  tabTextActive: {
    fontWeight: '700',
    color: DESIGN_TOKENS.colors.text,
  },
});
