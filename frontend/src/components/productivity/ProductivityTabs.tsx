import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab, TaskPriority } from '../../hooks/productivity/useProductivityViewModel';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  transparent: 'transparent',
};

const S = theme.spacing;
const R = theme.borderRadius;

interface ProductivityTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export function ProductivityTabs({
  activeTab,
  setActiveTab,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}: ProductivityTabsProps) {
  const { t } = useTranslation();

  return (
    <>
      <View style={styles.tabsContainer} accessibilityRole=\"tablist\">
        {[
          { key: 'today', label: t('productivity.today') || 'Today' },
          { key: 'all', label: t('productivity.all') || 'All' },
          { key: 'notes', label: t('productivity.notes') || 'Notes' },
          { key: 'tasks', label: t('productivity.tasks') || 'Tasks' },
        ].map((tab) => (
          <Pressable
            key={tab.key}
            onPress={() => setActiveTab(tab.key as Tab)} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }} accessibilityRole="tab" accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityRole="tab"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityRole=\"tab\"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityRole=\"tab\"
            accessibilityState={{ selected: activeTab === tab.key }}
            accessibilityRole=\"tab\"
            accessibilityState={{ selected: activeTab === tab.key }}
            style={[styles.tabButton, activeTab === tab.key && styles.tabButtonActive]}
          >
            <AppText style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}
            </AppText>
          </Pressable>
        ))}
      </View>

      {(activeTab === 'today' || activeTab === 'tasks') && (
        <View style={styles.priorityContainer}>
          {[
            { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) },
            { key: 'overdue', label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }) },
            { key: 'today', label: t('productivity.priority.today', { count: taskPriorityCounts.today }) },
            { key: 'upcoming', label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }) },
            { key: 'no_due', label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }) },
          ].map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key as TaskPriority)} accessibilityRole="button" accessibilityState={{ selected: taskPriority === option.key }} accessibilityRole="button" accessibilityState={{ selected: taskPriority === option.key }} accessibilityRole="button" accessibilityState={{ selected: taskPriority === option.key }} accessibilityRole="button" accessibilityState={{ selected: taskPriority === option.key }} accessibilityRole="button" accessibilityState={{ selected: taskPriority === option.key }}
              accessibilityRole="button"
              accessibilityState={{ selected: taskPriority === option.key }}
              accessibilityRole="button"
              accessibilityState={{ selected: taskPriority === option.key }}
              accessibilityRole=\"button\"
              accessibilityState={{ selected: taskPriority === option.key }}
              accessibilityRole=\"button\"
              accessibilityState={{ selected: taskPriority === option.key }}
              accessibilityRole=\"button\"
              accessibilityState={{ selected: taskPriority === option.key }}
              style={({ pressed }) => [
                styles.priorityButton,
                {
                  backgroundColor:
                    taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
                  borderColor:
                    taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.priorityText,
                  {
                    color:
                      taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
                  },
                ]}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </>
  );
}

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
  priorityContainer: {
    flexDirection: 'row',
    paddingHorizontal: S.xl,
    marginBottom: S.sm,
    flexWrap: 'wrap',
  },
  priorityButton: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityText: {
    fontWeight: '700',
  },
});
