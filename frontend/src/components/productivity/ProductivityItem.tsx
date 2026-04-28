import React from 'react';
import { View, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { NoteCard } from '@/components/productivity/NoteCard';
import { TaskCard } from '@/components/productivity/TaskCard';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';
import { CalendarEvent, Note, Task } from '@/core/models';

const S = theme.spacing;
const R = theme.borderRadius;

export type RenderItemData = {
  date?: number;
  type: 'note' | 'task' | 'event';
  item: Note | Task | CalendarEvent;
  id: string;
};

interface ProductivityItemProps {
  item: RenderItemData;
  deleteNote: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
}

export const ProductivityItem = React.memo(({
  item,
  deleteNote,
  deleteTask,
  toggleTask,
}: ProductivityItemProps) => {
  const { t, i18n } = useTranslation();


  const confirmDelete = (action: () => Promise<void>) =>
    Alert.alert(
      t('productivity.delete') || 'Delete',
      t('productivity.are_you_sure') || 'Are you sure?',
      [
        { text: t('settings.actions.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('settings.actions.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await action();
            } catch (error) {
              Alert.alert(
                t('errors.unexpected') || 'An unexpected error occurred.',
                t('productivity.delete_failed') || 'Failed to delete item.'
              );
            }
          },
        },
      ]
    );


  if (item.type === 'note') {
    const note = item.item as Note;
    return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
  }

  if (item.type === 'event') {
    const event = item.item as CalendarEvent;
    return (
      <View className="flex-row items-center bg-surface border border-border rounded-xl p-6 mb-4 shadow-sm">
        <View className="w-8 h-8 rounded-lg bg-primary-soft items-center justify-center mr-4">
          <Ionicons name="calendar-outline" size={16} color={DESIGN_TOKENS.colors.primary} />
        </View>
        <View className="flex-1">
          <AppText className="text-text font-bold text-[15px]">{event.title}</AppText>
          <AppText className="text-muted mt-0.5 text-[13px]">
            {new Intl.DateTimeFormat(i18n.language, {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: event.is_all_day ? undefined : '2-digit',
              minute: event.is_all_day ? undefined : '2-digit',
            }).format(new Date(event.start_time))}
          </AppText>
        </View>
      </View>
    );
  }

  const task = item.item as Task;
  return (
    <TaskCard
      task={task}
      onToggle={() => toggleTask(task.id)}
      onDelete={() => confirmDelete(() => deleteTask(task.id))}
    />
  );
});

ProductivityItem.displayName = 'ProductivityItem';
