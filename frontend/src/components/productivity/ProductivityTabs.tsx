import React from 'react';
import { View, Pressable, PressableStateCallbackType } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';

export type Tab = 'today' | 'all' | 'notes' | 'tasks';
export type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

interface Props {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export const ProductivityTabs = React.memo(({
  activeTab,
  setActiveTab,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}: Props) => {
  const { t } = useTranslation();

  return (
    <View>
      <View className="flex-row bg-surfaceSoft rounded-xl p-1 mx-6 mt-5 mb-4 border border-border">
        {(['today', 'all', 'notes', 'tasks'] as const).map((tab) => (
          <Pressable
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={({ pressed }: PressableStateCallbackType) => [
              pressed && activeTab !== tab ? { opacity: 0.6 } : undefined,
            ]}
            className={`flex-1 py-2 items-center rounded-lg bg-transparent ${activeTab === tab ? 'bg-surface shadow-sm elevation-sm' : ''}`}
          >
            <AppText className={`text-[14px] font-medium text-muted ${activeTab === tab ? 'font-bold text-text' : ''}`}>
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
        <View className="flex-row flex-wrap mx-6 mb-2">
          {(
            [
              { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) },
              {
                key: 'overdue',
                label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }),
              },
              {
                key: 'today',
                label: t('productivity.priority.today', { count: taskPriorityCounts.today }),
              },
              {
                key: 'upcoming',
                label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }),
              },
              {
                key: 'no_due',
                label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }),
              },
            ] as const
          ).map((option) => (
            <Pressable
              key={option.key}
              onPress={() => setTaskPriority(option.key)}
              style={({ pressed }: PressableStateCallbackType) => [
                pressed ? { opacity: 0.8 } : undefined,
              ]}
              className={`rounded-xl border px-2.5 py-1.5 mr-2 mb-2 ${
                taskPriority === option.key
                  ? 'border-primary bg-primary/10'
                  : 'border-border bg-surface'
              }`}
            >
              <AppText
                variant="caption"
                className={`font-bold ${
                  taskPriority === option.key ? 'text-primary' : 'text-muted'
                }`}
              >
                {option.label}
              </AppText>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
});

ProductivityTabs.displayName = 'ProductivityTabs';
