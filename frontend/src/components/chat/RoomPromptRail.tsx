import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
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

  const dynamicStyles = React.useMemo(() => StyleSheet.create({
    container: {
      backgroundColor: C.surface,
      borderColor: C.border,
    },
    heading: {
      color: C.subtext,
    },
    editingText: {
      color: C.primary,
    },
    chipDefault: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    chipPinned: {
      backgroundColor: C.primarySurface,
      borderColor: `${C.primary}55`,
    },
    chipTextDefault: {
      color: C.text,
    },
    chipTextPinned: {
      color: C.primary,
    },
    contextChip: {
      backgroundColor: C.surfaceHigh,
      borderColor: C.border,
    },
    contextText: {
      color: C.subtext,
    },
  }), [C]);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.container, dynamicStyles.container, theme.elevation.sm]}>
        <View style={styles.headerRow}>
          <AppText variant="caption" style={[styles.heading, dynamicStyles.heading]}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" style={[styles.editingText, dynamicStyles.editingText]}>
              {t('chat.editing', { defaultValue: 'Editing' })}
            </AppText>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <Pressable
            onPress={onSave}
            style={[
              styles.chip,
              dynamicStyles.chipPinned,
              (isStreaming || !canSave) ? styles.chipDisabled : null
            ]}
            disabled={isStreaming || !canSave}
          >
            <AppText style={[styles.chipText, dynamicStyles.chipTextPinned]}>{saveLabel}</AppText>
          </Pressable>

          {prompts.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={[
                styles.chip,
                action.pinned ? dynamicStyles.chipPinned : dynamicStyles.chipDefault,
                isStreaming ? styles.chipDisabledStreaming : null
              ]}
              disabled={isStreaming}
            >
              <AppText
                style={[
                  styles.chipText,
                  action.pinned ? dynamicStyles.chipTextPinned : dynamicStyles.chipTextDefault
                ]}
              >
                {action.pinned ? '★ ' : ''}
                {action.text}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contextScrollContent}
          >
            {contextActions.map((value) => (
              <Pressable
                key={value}
                onPress={() => onContextPress(value)}
                style={[styles.contextChip, dynamicStyles.contextChip]}
              >
                <AppText variant="caption" style={[styles.contextText, dynamicStyles.contextText]}>
                  {value}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  container: {
    borderRadius: theme.borderRadius.lg + 2,
    borderWidth: 1,
    paddingVertical: theme.spacing.sm,
  },
  headerRow: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.xs + 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  heading: {
    fontWeight: 'bold',
    flex: 1,
  },
  editingText: {
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  chip: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  chipDisabled: {
    opacity: 0.5,
  },
  chipDisabledStreaming: {
    opacity: 0.6,
  },
  chipText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  contextScrollContent: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  contextChip: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: 7,
    borderWidth: 1,
  },
  contextText: {
    fontWeight: 'bold',
  },
});
