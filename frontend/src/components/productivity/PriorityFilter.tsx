import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
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
    <View style={styles.container}>
      {options.map((option) => {
        const isActive = taskPriority === option.key;
        return (
          <Pressable
            key={option.key}
            onPress={() => setTaskPriority(option.key)}
            style={({ pressed }) => [
              styles.chip,
              isActive && styles.chipActive,
              pressed && { opacity: 0.8 },
            ]}
          >
            <AppText
              variant="caption"
              style={[
                styles.chipText,
                isActive && styles.chipTextActive,
              ]}
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

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: S.xl,
    marginBottom: S.sm,
  },
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: DESIGN_TOKENS.colors.primary,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
  },
  chipText: {
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: '700',
  },
  chipTextActive: {
    color: DESIGN_TOKENS.colors.primary,
  },
});
