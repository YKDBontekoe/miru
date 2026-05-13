import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

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
        className="flex-row rounded-xl p-1 mx-6 mt-6 mb-4 border"
        style={{ backgroundColor: C.surfaceHigh, borderColor: C.border }}
      >
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={({ pressed }) => [
              activeTab === tab && { backgroundColor: C.surface },
              pressed && activeTab !== tab && { opacity: 0.6 },
            ]}
          >
            <AppText
              className={`text-[14px] ${activeTab === tab ? 'font-bold' : 'font-medium'}`}
              style={{ color: activeTab === tab ? C.text : C.subtext }}
            >
              {tab === 'today'
                ? t('productivity.today') || 'Today'
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
        <View className="flex-row flex-wrap mx-6 mb-2">
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
              className="rounded-xl border px-2.5 py-1.5 mr-2 mb-2"
              style={({ pressed }) => [
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
                className="font-bold"
                style={{ color: taskPriority === option.key ? C.primary : C.subtext }}
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
