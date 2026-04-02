import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Task } from '@/core/models';

export const HomeTaskRow = React.memo(function HomeTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const { i18n } = useTranslation();

  let dateText = '';
  if (task.due_date) {
    const due = new Date(task.due_date);
    if (!isNaN(due.getTime())) {
      dateText = new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
        due
      );
    }
  }

  return (
    <ScalePressable onPress={onToggle} className="flex-row items-center py-2">
      <View
        className={`w-6 h-6 rounded-full border-2 items-center justify-center mr-3 ${task.completed ? 'border-primary bg-primary' : 'border-faint bg-transparent'}`}
      >
        {task.completed && <Ionicons name="checkmark" size={13} color="white" />}
      </View>
      <AppText
        className={`flex-1 text-sm ${task.completed ? 'text-faint line-through' : 'text-text'}`}
        numberOfLines={1}
      >
        {task.title}
      </AppText>
      {!!dateText && (
        <View className="bg-primaryFaint rounded-md px-2 py-1 ml-2">
          <AppText className="text-xs text-primary font-semibold">{dateText}</AppText>
        </View>
      )}
    </ScalePressable>
  );
});
