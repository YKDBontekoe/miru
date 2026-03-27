import React from 'react';
import { View, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../AppText';
import { Note } from '../../core/models';
import { theme } from '../../core/theme';

const T = theme.colors;

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

  // Dynamic style for cross-platform elevation handling
  const dynamicCardStyle = Platform.select({
    ios: theme.elevation.sm as any,
    android: { elevation: 1 },
    default: { elevation: 1 },
  });

  return (
    <View
      className="bg-surface-light rounded-xl p-lg mb-md border border-border-light"
      style={dynamicCardStyle}
    >
      <View className="flex-row justify-between items-start mb-xs">
        <AppText
          className="text-base font-bold text-onSurface-light flex-1 mr-sm"
          numberOfLines={1}
        >
          {note.title}
        </AppText>
        <Pressable onPress={onDelete} hitSlop={8} className="p-xs active:opacity-50">
          <Ionicons name="trash-outline" size={18} color={T.onSurface.mutedLight} />
        </Pressable>
      </View>
      {note.content ? (
        <AppText
          variant="bodySm"
          className="text-onSurface-mutedLight mt-xs leading-5 mb-md"
          numberOfLines={3}
        >
          {note.content}
        </AppText>
      ) : null}
      <View className="flex-row items-center mt-xs">
        <Ionicons
          name="time-outline"
          size={12}
          color={T.onSurface.disabledLight}
          style={{ marginRight: 4 }}
        />
        <AppText variant="caption" className="text-onSurface-disabledLight text-[11px] font-medium">
          {date}
        </AppText>
      </View>
    </View>
  );
});

NoteCard.displayName = 'NoteCard';
