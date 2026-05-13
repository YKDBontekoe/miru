import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { useTheme } from '@/hooks/useTheme';
import { Tab, TaskPriority } from '@/hooks/viewmodels/useProductivityViewModel';

interface ProductivityTabsProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export const ProductivityTabs = React.memo(function ProductivityTabs({
  activeTab,
  setActiveTab,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}: ProductivityTabsProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <>
      <View
        style={[
          styles.tabsContainer,
          { backgroundColor: C.surfaceHigh, borderColor: C.border },
        ]}
      >
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={({ pressed }) => [
              styles.tabButton,
              activeTab === tab && [styles.tabButtonActive, { backgroundColor: C.surface }],
              pressed && activeTab !== tab && { opacity: 0.6 },
            ]}
          >
            <AppText
              style={[
                styles.tabText,
                { color: activeTab === tab ? C.text : C.subtext },
                activeTab === tab && styles.tabTextActive,
              ]}
            >
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

      {(activeTab === 'tasks' || activeTab === 'today') && (
        <View style={styles.priorityContainer}>
          {(
            [
              {
                key: 'all',
                label: t('productivity.priority.all', { count: taskPriorityCounts.all }),
              },
              {
                key: 'overdue',
                label: t('productivity.priority.overdue', {
                  count: taskPriorityCounts.overdue,
                }),
              },
              {
                key: 'today',
                label: t('productivity.priority.today', { count: taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: t('productivity.priority.upcoming', {
                  count: taskPriorityCounts.upcoming,
                }),
              },
              {
                key: 'no_due',
                label: t('productivity.priority.no_due', {
                  count: taskPriorityCounts.no_due,
                }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              style={({ pressed }) => [
                styles.priorityButton,
                {
                  borderColor: taskPriority === option.key ? C.primary : C.border,
                  backgroundColor:
                    taskPriority === option.key ? C.primarySurface : C.surface,
                },
                pressed && { opacity: 0.8 },
              ]}
            >
              <AppText
                variant="caption"
                style={[
                  styles.priorityText,
                  { color: taskPriority === option.key ? C.primary : C.subtext },
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
});

const styles = StyleSheet.create({
  tabsContainer: {
    flexDirection: 'row',
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xs,
    marginHorizontal: theme.spacing.xl,
    marginTop: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    paddingVertical: theme.spacing.sm,
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: 'transparent',
  },
  tabButtonActive: {
    ...theme.elevation.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tabTextActive: {
    fontWeight: '700',
  },
  priorityContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.sm,
  },
  priorityButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  priorityText: {
    fontWeight: '700',
  },
});
