import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
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
    <View className="flex-row bg-surface-soft rounded-xl p-1 mx-6 mt-6 mb-4 border border-border">
      {TABS.map((tab) => {
        const isActive = activeTab === tab;
        return (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            className={`flex-1 py-3 items-center rounded-lg bg-transparent ${isActive ? 'bg-surface shadow-sm' : 'active:opacity-60'}`}
          >
            <AppText className={`text-[14px] font-medium text-muted ${isActive ? 'font-bold text-text' : ''}`}>
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
