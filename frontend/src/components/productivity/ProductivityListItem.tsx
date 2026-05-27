import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { NoteCard } from './NoteCard';
import { TaskCard } from './TaskCard';
import { CalendarEvent, Note, Task } from '../../core/models';
import { theme } from '../../core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import type { RenderItemData } from '../../hooks/useProductivityViewModel';

const T = {
  surface: { light: DESIGN_TOKENS.colors.surface },
  border: { light: DESIGN_TOKENS.colors.border },
  onSurface: {
    light: DESIGN_TOKENS.colors.text,
    mutedLight: DESIGN_TOKENS.colors.muted,
  },
  primary: {
    DEFAULT: DESIGN_TOKENS.colors.primary,
    surfaceLight: DESIGN_TOKENS.colors.primarySoft,
  },
};
const S = theme.spacing;
const R = theme.borderRadius;

type ProductivityListItemProps = {
  item: RenderItemData;
  deleteNote: (id: string) => Promise<void>;
  toggleTask: (taskId: string) => void;
  deleteTask: (taskId: string) => void;
  confirmDelete: (action: () => Promise<void>) => void;
};

export const ProductivityListItem = memo(
  function ProductivityListItem({ item, deleteNote, toggleTask, deleteTask, confirmDelete }: ProductivityListItemProps) {
    const { i18n } = useTranslation();

    if (item.type === 'note') {
      const note = item.item as Note;
      return <NoteCard note={note} onDelete={() => confirmDelete(async () => deleteNote(note.id))} />;
    }

    if (item.type === 'event') {
      const event = item.item as CalendarEvent;
      return (
        <View style={styles.eventCard}>
          <View style={styles.eventIcon}>
            <Ionicons name="calendar-outline" size={16} color={T.primary.DEFAULT} />
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
        onDelete={() => confirmDelete(async () => deleteTask(task.id))}
      />
    );
  }
);

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: T.surface.light,
    borderWidth: 1,
    borderColor: T.border.light,
    borderRadius: R.xl,
    padding: S.lg,
    marginBottom: S.md,
    ...theme.elevation.sm,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: R.lg,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  eventBody: {
    flex: 1,
  },
  eventTitle: {
    color: T.onSurface.light,
    fontWeight: '700',
    fontSize: 15,
  },
  eventMeta: {
    color: T.onSurface.mutedLight,
    marginTop: 2,
    fontSize: 13,
  },
});
