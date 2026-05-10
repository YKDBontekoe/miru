import React from 'react';
import { StyleSheet, Pressable, ScrollView, View } from 'react-native';
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
      <View style={[styles.railCard, { backgroundColor: C.surface, borderColor: C.border }]}>
        <View style={styles.header}>
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
          contentContainerStyle={styles.scrollContent}
        >
          <ScalePressable
            onPress={onSave}
            style={[
              styles.pill,
              { backgroundColor: C.primarySurface, borderColor: `${C.primary}55` },
              (isStreaming || !canSave) && styles.opacity50,
            ]}
            disabled={isStreaming || !canSave}
          >
            <AppText style={[styles.pillText, { color: C.primary }]}>{saveLabel}</AppText>
          </ScalePressable>

          {prompts.map((action) => (
            <ScalePressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={[
                styles.pill,
                action.pinned
                  ? { backgroundColor: C.primarySurface, borderColor: `${C.primary}55` }
                  : { backgroundColor: C.surfaceMid, borderColor: C.border },
                isStreaming && styles.opacity60,
              ]}
              disabled={isStreaming}
            >
              <AppText
                style={[
                  styles.pillText,
                  action.pinned ? { color: C.primary } : { color: C.text },
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
                style={[styles.contextActionPill, { backgroundColor: C.surfaceMid, borderColor: C.border }]}
              >
                <AppText variant="caption" style={[styles.contextActionText, { color: C.muted }]}>
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
    borderRadius: theme.borderRadius.xl,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
    ...theme.elevation.sm,
  },
  header: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs,
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
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  pill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  pillText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
  },
  opacity50: {
    opacity: 0.5,
  },
  opacity60: {
    opacity: 0.6,
  },
  contextScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  contextActionPill: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
  },
  contextActionText: {
    fontWeight: 'bold',
  },
});
