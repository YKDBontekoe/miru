import React from 'react';
import { View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Task } from '@/core/models';
import { HOME_COLORS } from '../homeTheme';

export function HomeTaskRow({
  task,
  onToggle,
  locale,
}: {
  task: Task;
  onToggle: () => void;
  locale?: string;
}) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
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
}
