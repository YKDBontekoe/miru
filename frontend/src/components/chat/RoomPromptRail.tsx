import React from 'react';
import { ScrollView, View, StyleSheet, Platform } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface PromptItem {
  id: string;
  text: string;
  pinned: boolean;
}

interface RoomPromptRailProps {
  prompts: PromptItem[];
  isStreaming: boolean;
  saveLabel: string;
  heading: string;
  isEditing: boolean;
  canSave: boolean;
  onSave: () => void;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
  contextActions?: string[];
  onContextPress?: (value: string) => void;
}

export function RoomPromptRail({
  prompts,
  isStreaming,
  saveLabel,
  heading,
  isEditing,
  canSave,
  onSave,
  onPromptPress,
  onPromptLongPress,
  contextActions,
  onContextPress,
}: RoomPromptRailProps) {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.railCard,
          {
            backgroundColor: C.surface,
            borderColor: C.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <AppText variant="caption" style={[styles.headingText, { color: C.muted }]}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" style={[styles.editingText, { color: C.primary }]}>
              {t('chat.editing', { defaultValue: 'Editing' })}
            </AppText>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsScrollContent}
        >
          <ScalePressable
            onPress={onSave}
            style={[
              styles.promptPill,
              {
                borderColor: C.primary,
                backgroundColor: C.surface,
                opacity: isStreaming || !canSave ? 0.5 : 1,
              },
            ]}
            disabled={isStreaming || !canSave}
          >
            <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
            <AppText style={[styles.promptPillText, { color: C.primary }]}>{saveLabel}</AppText>
          </ScalePressable>

          {prompts.map((action) => (
            <ScalePressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={[
                styles.promptPill,
                {
                  borderColor: action.pinned ? C.primary : C.border,
                  backgroundColor: action.pinned ? C.surface : C.surfaceHigh,
                  opacity: isStreaming ? 0.6 : 1,
                },
              ]}
              disabled={isStreaming}
            >
              {action.pinned ? (
                <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
              ) : null}
              <AppText
                style={[
                  styles.promptPillText,
                  { color: action.pinned ? C.primary : C.text },
                ]}
              >
                {action.pinned ? '★ ' : ''}
                {action.text}
              </AppText>
            </ScalePressable>
          ))}
        </ScrollView>

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contextScrollContent}
          >
            {contextActions.map((value) => (
              <ScalePressable
                key={value}
                onPress={() => onContextPress(value)}
                style={[
                  styles.contextPill,
                  {
                    backgroundColor: C.surfaceHigh,
                    borderColor: C.border,
                  },
                ]}
              >
                <AppText variant="caption" style={[styles.contextPillText, { color: C.muted }]}>
                  {value}
                </AppText>
              </ScalePressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  railCard: {
    borderRadius: 18,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
    ...Platform.select({
      ios: theme.elevation.md,
      android: theme.elevation.md,
    }),
  },
  headerRow: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingText: {
    fontWeight: 'bold',
    flex: 1,
  },
  editingText: {
    fontWeight: 'bold',
  },
  promptsScrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  promptPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  promptPillText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  contextScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  contextPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  contextPillText: {
    fontWeight: 'bold',
  },
});
