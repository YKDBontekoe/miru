import React from 'react';
import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { Tab, TaskPriority } from '@/hooks/viewmodels/useProductivityViewModel';

const T = {
  background: { light: DESIGN_TOKENS.colors.pageBg },
  surface: { light: DESIGN_TOKENS.colors.surface, highLight: DESIGN_TOKENS.colors.surfaceSoft },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
    disabledLight: DESIGN_TOKENS.colors.faint,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
  white: '#FFFFFF',
  transparent: 'transparent',
};
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
}