import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
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

export const RoomPromptRail = ({
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
}: RoomPromptRailProps) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <View style={styles.railCard}>
        <View style={styles.headerRow}>
          <AppText variant="caption" style={styles.headingText}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" style={styles.editingText}>
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
            style={({ pressed }) => [
              styles.promptItem,
              styles.saveButton,
              (isStreaming || !canSave) && styles.disabledOpacity,
              pressed && styles.pressed,
            ]}
            disabled={isStreaming || !canSave}
          >
            <AppText style={styles.saveButtonText}>{saveLabel}</AppText>
          </Pressable>

          {prompts.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={({ pressed }) => [
                styles.promptItem,
                action.pinned ? styles.pinnedPrompt : styles.unpinnedPrompt,
                isStreaming && styles.streamingOpacity,
                pressed && styles.pressed,
              ]}
              disabled={isStreaming}
            >
              <AppText
                style={[
                  styles.promptText,
                  action.pinned ? styles.pinnedPromptText : styles.unpinnedPromptText,
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
            contentContainerStyle={styles.contextActionsScroll}
          >
            {contextActions.map((value) => (
              <Pressable
                key={value}
                onPress={() => onContextPress(value)}
                style={({ pressed }) => [
                  styles.contextAction,
                  pressed && styles.pressed,
                ]}
              >
                <AppText variant="caption" style={styles.contextActionText}>
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
  container: {
    paddingHorizontal: theme.spacing.md,
    paddingBottom: theme.spacing.sm,
  },
  railCard: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    paddingVertical: theme.spacing.sm,
    ...DESIGN_TOKENS.shadow,
  },
  headerRow: {
    paddingHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingText: {
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: 'bold',
    flex: 1,
  },
  editingText: {
    color: DESIGN_TOKENS.colors.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: theme.spacing.md,
  },
  promptItem: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderColor: `${DESIGN_TOKENS.colors.primary}55`,
  },
  disabledOpacity: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
    color: DESIGN_TOKENS.colors.primary,
  },
  pinnedPrompt: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderColor: `${DESIGN_TOKENS.colors.primary}55`,
  },
  unpinnedPrompt: {
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  streamingOpacity: {
    opacity: 0.6,
  },
  promptText: {
    fontSize: theme.typography.caption.fontSize,
    fontWeight: 'bold',
  },
  pinnedPromptText: {
    color: DESIGN_TOKENS.colors.primary,
  },
  unpinnedPromptText: {
    color: DESIGN_TOKENS.colors.text,
  },
  contextActionsScroll: {
    paddingHorizontal: theme.spacing.md,
    paddingTop: theme.spacing.sm,
  },
  contextAction: {
    marginRight: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
  },
  contextActionText: {
    color: DESIGN_TOKENS.colors.muted,
    fontWeight: 'bold',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});
