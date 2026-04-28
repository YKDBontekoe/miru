import React from 'react';
import { View, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const S = theme.spacing;

export type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

interface PriorityFilterProps {
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export const PriorityFilter = React.memo(({
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}: PriorityFilterProps) => {
  const { t } = useTranslation();

  const options: { key: TaskPriority; label: string }[] = [
    { key: 'all', label: t('productivity.priority.all', { count: taskPriorityCounts.all }) || `All (${taskPriorityCounts.all})` },
    { key: 'overdue', label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }) || `Overdue (${taskPriorityCounts.overdue})` },
    { key: 'today', label: t('productivity.priority.today', { count: taskPriorityCounts.today }) || `Today (${taskPriorityCounts.today})` },
    { key: 'upcoming', label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }) || `Upcoming (${taskPriorityCounts.upcoming})` },
    { key: 'no_due', label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }) || `No Due Date (${taskPriorityCounts.no_due})` },
  ];

  return (
    <View className="flex-row flex-wrap mx-6 mb-2">
      {options.map((option) => {
        const isActive = taskPriority === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => setTaskPriority(option.key)}
            className={`rounded-xl border px-3 py-1.5 mr-2 mb-2 ${isActive ? 'border-primary bg-primary-soft' : 'border-border bg-surface'} active:opacity-80`}
          >
            <AppText
              variant="caption"
              className={`text-muted font-bold ${isActive ? 'text-primary' : ''}`}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
});

PriorityFilter.displayName = 'PriorityFilter';
