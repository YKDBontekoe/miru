import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../AppText';
import { theme } from '../../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;

export type TaskPriority = 'all' | 'overdue' | 'today' | 'upcoming' | 'no_due';

interface TaskFiltersProps {
  taskPriority: TaskPriority;
  onPriorityChange: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
}

export function TaskFilters({
  taskPriority,
  onPriorityChange,
  taskPriorityCounts,
}: TaskFiltersProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
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
          onPress={() => onPriorityChange(option.key)}
          style={({ pressed }) => [
            styles.filterButton,
            {
              borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
              backgroundColor:
                taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.filterText,
              {
                color: taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
              },
            ]}
          >
            {option.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: S.xl,
    marginBottom: S.sm,
  },
  filterButton: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  filterText: {
    fontWeight: '700',
  },
});
