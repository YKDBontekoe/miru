import React from 'react';
import { View, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { Note } from '../../core/models';
import { theme } from '../../core/theme';

const T = theme.colors;
const S = theme.spacing;
const R = theme.borderRadius;

interface Props {
  note: Note;
  onDelete: () => void;
}

export const NoteCard = React.memo(({ note, onDelete }: Props) => {
  const { i18n } = useTranslation();
  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(note.created_at));

  return (
    <View style={styles.noteCard}>
      <View style={styles.noteCardHeader}>
        <AppText style={styles.noteCardTitle} numberOfLines={1}>
          {note.title}
        </AppText>
        <Pressable
          onPress={onDelete}
          hitSlop={8}
          style={({ pressed }) => [styles.deleteIcon, pressed && { opacity: 0.5 }]}
        >
          <Ionicons name="trash-outline" size={18} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      {note.content ? (
        <AppText variant="bodySm" style={styles.noteCardContent} numberOfLines={3}>
          {note.content}
        </AppText>
      ) : null}
      <View style={styles.noteCardFooter}>
        <Ionicons name="time-outline" size={12} color={T.onSurface.disabledLight} style={{ marginRight: 4 }} />
        <AppText variant="caption" style={styles.noteCardDate}>
          {date}
        </AppText>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  noteCard: {
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
  noteCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: S.xs,
  },
  noteCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.onSurface.light,
    flex: 1,
    marginRight: S.sm,
  },
  noteCardContent: {
    color: T.onSurface.mutedLight,
    marginTop: S.xs,
    lineHeight: 20,
    marginBottom: S.md,
  },
  noteCardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: S.xs,
  },
  noteCardDate: {
    color: T.onSurface.disabledLight,
    fontSize: 11,
    fontWeight: '500',
  },
  deleteIcon: {
    padding: S.xs,
  },
});
