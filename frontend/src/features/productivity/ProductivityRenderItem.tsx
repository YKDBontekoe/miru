import React, { memo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { NoteCard } from '@/components/productivity/NoteCard';
import { TaskCard } from '@/components/productivity/TaskCard';
import { theme } from '@/core/theme';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { CalendarEvent, Note, Task } from '@/core/models';
import type { RenderItemData } from './useProductivityViewModel';

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

type ProductivityRenderItemProps = {
  item: RenderItemData;
  language: string;
  confirmDelete: (action: () => Promise<void>) => void;
  deleteNote: (id: string) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
};

export const ProductivityRenderItem = memo<ProductivityRenderItemProps>(
  ({ item, language, confirmDelete, deleteNote, deleteTask, toggleTask }) => {
    if (item.type === 'note') {
      const note = item.item as Note;
      return <NoteCard note={note} onDelete={() => confirmDelete(() => deleteNote(note.id))} />;
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
              {new Intl.DateTimeFormat(language, {
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
  }
);

ProductivityRenderItem.displayName = 'ProductivityRenderItem';

const styles = StyleSheet.create({
  eventCard: {
    flexDirection: 'row',
    padding: S.md,
    backgroundColor: T.surface.light,
    borderRadius: R.xl,
    borderWidth: 1,
    borderColor: T.border.light,
    marginBottom: S.sm,
  },
  eventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: T.primary.surfaceLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: S.md,
  },
  eventBody: {
    flex: 1,
    justifyContent: 'center',
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: T.onSurface.light,
    marginBottom: 2,
  },
  eventMeta: {
    fontSize: 13,
    color: T.onSurface.mutedLight,
  },
});
