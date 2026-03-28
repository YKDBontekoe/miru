import React from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { ScalePressable } from '../ScalePressable';
import { Note } from '../../core/models';
import { theme } from '../../core/theme';
import { useTheme } from '../../hooks/useTheme';

interface Props {
  note: Note;
  onDelete: () => void;
}

export const NoteCard = React.memo(({ note, onDelete }: Props) => {
  const { i18n } = useTranslation();
  const { C } = useTheme();

  const date = new Intl.DateTimeFormat(i18n.language, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(note.created_at));

  const styles = React.useMemo(() => StyleSheet.create({
    card: {
      backgroundColor: C.surface,
      borderRadius: theme.borderRadius.xl,
      padding: theme.spacing.lg,
      marginBottom: theme.spacing.md,
      borderWidth: 1,
      borderColor: C.border,
      ...Platform.select({
        ios: theme.elevation.sm as any,
        android: { elevation: 1 },
        default: { elevation: 1 },
      }),
    },
    headerRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: theme.spacing.xs,
    },
    title: {
      fontSize: 16,
      fontWeight: 'bold',
      color: C.text,
      flex: 1,
      marginEnd: theme.spacing.sm,
    },
    deleteIconWrapper: {
      padding: theme.spacing.xs,
    },
    content: {
      color: C.muted,
      marginTop: theme.spacing.xs,
      lineHeight: 20,
      marginBottom: theme.spacing.md,
    },
    footerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginTop: theme.spacing.xs,
    },
    dateText: {
      color: C.faint,
      fontSize: 11,
      fontWeight: '500',
    },
    timeIcon: {
      marginEnd: 4,
    },
  }), [C]);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <AppText style={styles.title} numberOfLines={1}>
          {note.title}
        </AppText>
        <ScalePressable onPress={onDelete} hitSlop={8} style={styles.deleteIconWrapper}>
          <Ionicons name="trash-outline" size={18} color={C.muted} />
        </ScalePressable>
      </View>
      {note.content ? (
        <AppText variant="bodySm" style={styles.content} numberOfLines={3}>
          {note.content}
        </AppText>
      ) : null}
      <View style={styles.footerRow}>
        <Ionicons name="time-outline" size={12} color={C.faint} style={styles.timeIcon} />
        <AppText variant="caption" style={styles.dateText}>
          {date}
        </AppText>
      </View>
    </View>
  );
});

NoteCard.displayName = 'NoteCard';
