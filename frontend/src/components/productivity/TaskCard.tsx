import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { Task } from '../../core/models';
import { theme } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';

const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export const TaskCard = React.memo(({ task, onToggle, onDelete }: Props) => {
  const { t, i18n } = useTranslation();
  const { C } = useTheme();

  const styles = React.useMemo(
    () =>
      StyleSheet.create({
        taskCard: {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.surface,
          borderRadius: R.xl,
          padding: S.lg,
          marginBottom: S.md,
          borderWidth: 1,
          borderColor: C.border,
          ...Platform.select({
            ios: theme.elevation.sm as any,
            android: { elevation: 1 },
            default: { elevation: 1 },
          }),
        },
        taskCardCompleted: {
          backgroundColor: C.successSurface,
          borderColor: C.success,
        },
        taskToggle: {
          marginRight: S.md,
        },
        taskCheckbox: {
          width: 24,
          height: 24,
          borderRadius: R.sm,
          borderWidth: 2,
          borderColor: C.faint,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: theme.colors.transparent,
        },
        taskCheckboxActive: {
          borderColor: C.success,
          backgroundColor: C.success,
        },
        taskBody: {
          flex: 1,
        },
        taskTitle: {
          fontSize: 16,
          fontWeight: '600',
          color: C.text,
        },
        taskTitleCompleted: {
          textDecorationLine: 'line-through',
          color: C.muted,
        },
        taskDueDate: {
          color: C.primary,
          fontWeight: '600',
          marginTop: 4,
          fontSize: 12,
        },
        deleteIcon: {
          padding: S.xs,
        },
      }),
    [C.border, C.faint, C.muted, C.primary, C.success, C.successSurface, C.surface, C.text]
  );

  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
      <ScalePressable onPress={onToggle} hitSlop={12} style={styles.taskToggle}>
        <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxActive]}>
          {task.completed && <Ionicons name="checkmark" size={16} color={theme.colors.white} />}
        </View>
      </ScalePressable>
      <View style={styles.taskBody}>
        <AppText style={[styles.taskTitle, task.completed && styles.taskTitleCompleted]}>
          {task.title}
        </AppText>
        {task.due_date && (
          <AppText variant="caption" style={styles.taskDueDate}>
            {t('productivity.due_date', {
              date: new Intl.DateTimeFormat(i18n.language, {
                month: 'short',
                day: 'numeric',
              }).format(new Date(task.due_date)),
            })}
          </AppText>
        )}
      </View>
      <ScalePressable onPress={onDelete} hitSlop={8} style={styles.deleteIcon}>
        <Ionicons name="trash-outline" size={18} color={C.muted} />
      </ScalePressable>
    </View>
  );
});

TaskCard.displayName = 'TaskCard';
