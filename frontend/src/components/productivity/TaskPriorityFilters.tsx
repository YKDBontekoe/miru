import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { TaskPriority } from '../../hooks/useProductivityViewModel';

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
  taskPriority: TaskPriority;
  onPriorityChange: (priority: TaskPriority) => void;
  counts: Record<TaskPriority, number>;
};

export function TaskPriorityFilters({
  taskPriority,
  onPriorityChange,
  counts,
}: TaskPriorityFiltersProps) {
  const { t } = useTranslation();

  const options = [
    { key: 'all' as const, label: t('productivity.priority.all', { count: counts.all }) },
    {
      key: 'overdue' as const,
      label: t('productivity.priority.overdue', { count: counts.overdue }),
    },
    {
      key: 'today' as const,
      label: t('productivity.priority.today', { count: counts.today }),
    },
    {
      key: 'upcoming' as const,
      label: t('productivity.priority.upcoming', { count: counts.upcoming }),
    },
    {
      key: 'no_due' as const,
      label: t('productivity.priority.no_due', { count: counts.no_due }),
    },
  ];

  return (
    <View style={styles.container}>
      {options.map((option) => (
        <Pressable
          key={option.key}
          onPress={() => onPriorityChange(option.key)}
          style={({ pressed }) => [
            styles.chip,
            taskPriority === option.key && styles.chipActive,
            pressed && { opacity: 0.8 },
          ]}
        >
          <AppText
            variant="caption"
            style={[
              styles.chipText,
              taskPriority === option.key && styles.chipTextActive,
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
  chip: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: T.border.light,
    backgroundColor: T.surface.light,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
  },
  chipActive: {
    borderColor: T.primary.DEFAULT,
    backgroundColor: T.primary.surfaceLight,
  },
  chipText: {
    color: T.onSurface.mutedLight,
    fontWeight: '700',
  },
  chipTextActive: {
    color: T.primary.DEFAULT,
  },
});
