import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { Tab, TaskPriority } from '@/hooks/viewmodels/useProductivityViewModel';

const S = theme.spacing;

interface TaskPriorityFiltersProps {
  activeTab: Tab;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export function TaskPriorityFilters({
  activeTab,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}: TaskPriorityFiltersProps) {
  const { t } = useTranslation();

  const options = useMemo(() => [
    {
      key: 'all',
      label: t('productivity.priority.all', { count: taskPriorityCounts.all })
    },
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
  ] as const, [t, taskPriorityCounts]);

  if (activeTab !== 'tasks' && activeTab !== 'today') {
    return null;
  }

  return (
    <View
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginHorizontal: S.xl,
        marginBottom: S.sm,
      }}
    >
      {options.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => setTaskPriority(option.key)}
          className={`rounded-xl border px-2.5 py-1.5 mr-2 mb-2 active:opacity-80 ${
            taskPriority === option.key
              ? 'border-primary bg-primarySoft'
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
  );
}
