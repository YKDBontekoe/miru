import React, { useCallback } from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Task } from '@/core/models';
import { HOME_COLORS } from './homeTheme';

/**
 * A row component displaying a task on the home dashboard.
 * @param {object} props - The component props.
 * @param {Task} props.task - The task object to display.
 * @param {(id: string) => void} props.onToggle - The callback function executed when the task row is pressed (e.g. to toggle completion).
 * @returns {React.ReactElement} The HomeTaskRow component.
 */
export const HomeTaskRow = React.memo(function HomeTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string) => void;
}) {
  const { i18n } = useTranslation();

  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  const handleToggle = useCallback(() => {
    onToggle(task.id);
  }, [task.id, onToggle]);

  return (
    <ScalePressable
      onPress={handleToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: HOME_COLORS.softSurface,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: task.completed ? HOME_COLORS.primary : '#8FB7A7',
          backgroundColor: task.completed ? HOME_COLORS.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={{
          flex: 1,
          color: task.completed ? HOME_COLORS.muted : HOME_COLORS.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
          fontWeight: '600',
        }}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: HOME_COLORS.accentSoft,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <AppText variant="caption" style={{ color: '#9E5817', fontWeight: '700' }}>
            {dueText}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
});
