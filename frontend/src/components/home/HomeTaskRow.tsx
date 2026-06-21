import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Task } from '@/core/models';
import { HOME_COLORS } from '@/components/home/homeTheme';

export const HomeTaskRow = ({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) => {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      className="flex-row items-center rounded-2xl px-3 py-[11px] mb-2"
      style={{
        backgroundColor: HOME_COLORS.softSurface,
      }}
    >
      <View
        className="w-6 h-6 rounded-xl border-2 items-center justify-center mr-2.5"
        style={{
          borderColor: task.completed ? HOME_COLORS.primary : '#8FB7A7',
          backgroundColor: task.completed ? HOME_COLORS.primary : 'transparent',
        }}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        className={`flex-1 font-semibold ${task.completed ? 'line-through' : 'no-underline'}`}
        style={{
          color: task.completed ? HOME_COLORS.muted : HOME_COLORS.text,
        }}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View
          className="rounded-xl px-2 py-1"
          style={{
            backgroundColor: HOME_COLORS.accentSoft,
          }}
        >
          <AppText variant="caption" className="font-bold" style={{ color: '#9E5817' }}>
            {dueText}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
};
