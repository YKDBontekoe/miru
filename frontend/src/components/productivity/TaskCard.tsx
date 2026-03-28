import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { Task } from '../../core/models';
import { theme } from '../../core/theme';

const T = theme.colors;
const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export const TaskCard = React.memo(({ task, onToggle, onDelete }: Props) => {
  const { t, i18n } = useTranslation();
  return (
    <View style={[styles.taskCard, task.completed && styles.taskCardCompleted]}>
      <Pressable
        onPress={onToggle}
        hitSlop={12}
        style={({ pressed }) => [styles.taskToggle, pressed && { opacity: 0.7 }]}
      >
        <View style={[styles.taskCheckbox, task.completed && styles.taskCheckboxActive]}>
          {task.completed && <Ionicons name="checkmark" size={16} color={T.white} />}
        </View>
      </Pressable>
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
      <Pressable
        onPress={onDelete}
        hitSlop={8}
        style={({ pressed }) => [styles.deleteIcon, pressed && { opacity: 0.5 }]}
      >
        <Ionicons name="trash-outline" size={18} color={T.onSurface.mutedLight} />
      </Pressable>
    </View>
  );
});

TaskCard.displayName = 'TaskCard';

const styles = StyleSheet.create({
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface.light,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    borderWidth: 1,
    borderColor: T.border.light,
    ...Platform.select({
      ios: theme.elevation.sm as any,
      android: { elevation: 1 },
      default: { elevation: 1 },
    }),
  },
  taskCardCompleted: {
    backgroundColor: T.status.successSurfaceLight,
    borderColor: T.status.success100,
  },
  taskToggle: {
    marginRight: S.md,
  },
  taskCheckbox: {
    width: 24,
    height: 24,
    borderRadius: R.sm,
    borderWidth: 2,
    borderColor: T.onSurface.disabledLight,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: T.transparent,
  },
  taskCheckboxActive: {
    borderColor: T.status.success,
    backgroundColor: T.status.success,
  },
  taskBody: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.onSurface.light,
  },
  taskTitleCompleted: {
    textDecorationLine: 'line-through',
    color: T.onSurface.mutedLight,
  },
  taskDueDate: {
    color: T.primary.DEFAULT,
    fontWeight: '600',
    marginTop: 4,
    fontSize: 12,
  },
  deleteIcon: {
    padding: S.xs,
  },
});
