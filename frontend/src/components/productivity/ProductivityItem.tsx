import React from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { NoteCard } from './NoteCard';
import { TaskCard } from './TaskCard';
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
          onPress: () => action(),
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
      <View style={styles.eventCard}>
        <View style={styles.eventIcon}>
          <Ionicons name="calendar-outline" size={16} color={DESIGN_TOKENS.colors.primary} />
        </View>
        <View style={styles.eventBody}>
          <AppText style={styles.eventTitle}>{event.title}</AppText>
          <AppText style={styles.eventMeta}>
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

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: DESIGN_TOKENS.colors.surface,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    ...theme.elevation.sm,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: R.lg,
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: DESIGN_TOKENS.colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  eventMeta: {
    color: DESIGN_TOKENS.colors.muted,
    marginTop: 2,
    fontSize: 13,
  },
});
