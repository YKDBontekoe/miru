import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { TaskPriority } from './useProductivityViewModel';

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

type TaskPriorityFiltersProps = {
  t: (key: string, options?: any) => string;
  taskPriority: TaskPriority;
  setTaskPriority: (priority: TaskPriority) => void;
  taskPriorityCounts: Record<TaskPriority, number>;
};

export const TaskPriorityFilters: React.FC<TaskPriorityFiltersProps> = ({
  t,
  taskPriority,
  setTaskPriority,
  taskPriorityCounts,
}) => {
  const options = [
    {
      key: 'all' as const,
      label: t('productivity.priority.all', { count: taskPriorityCounts.all }),
    },
    {
      key: 'overdue' as const,
      label: t('productivity.priority.overdue', { count: taskPriorityCounts.overdue }),
    },
    {
      key: 'today' as const,
      label: t('productivity.priority.today', { count: taskPriorityCounts.today }),
    },
    {
      key: 'upcoming' as const,
      label: t('productivity.priority.upcoming', { count: taskPriorityCounts.upcoming }),
    },
    {
      key: 'no_due' as const,
      label: t('productivity.priority.no_due', { count: taskPriorityCounts.no_due }),
    },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => setTaskPriority(option.key)}
          style={({ pressed }) => [
            {
              borderRadius: 12,
              borderWidth: 1,
              borderColor: taskPriority === option.key ? T.primary.DEFAULT : T.border.light,
              backgroundColor:
                taskPriority === option.key ? T.primary.surfaceLight : T.surface.light,
              paddingHorizontal: 10,
              paddingVertical: 6,
              marginRight: 8,
              marginBottom: 8,
            },
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppText
            variant="caption"
            style={{
              color: taskPriority === option.key ? T.primary.DEFAULT : T.onSurface.mutedLight,
              fontWeight: '700',
            }}
          >
            {option.label}
          </AppText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: S.xl,
    marginBottom: S.sm,
  },
});
