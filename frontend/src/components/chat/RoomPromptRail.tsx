import React from 'react';
import { Pressable, ScrollView, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  border: DESIGN_TOKENS.colors.border,
  muted: DESIGN_TOKENS.colors.muted,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
  surfaceSoft: DESIGN_TOKENS.colors.surfaceSoft,
  text: DESIGN_TOKENS.colors.text,
  white: DESIGN_TOKENS.colors.white,
};

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

  return (
    <View style={styles.container}>
      <View style={styles.railContainer}>
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
            style={[
              styles.actionButton,
              styles.saveButton,
              (isStreaming || !canSave) && styles.opacity50,
            ]}
            disabled={isStreaming || !canSave}
          >
            <AppText style={[styles.actionButtonText, { color: C.primary }]}>{saveLabel}</AppText>
          </Pressable>

          {prompts.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={[
                styles.actionButton,
                action.pinned ? styles.pinnedButton : styles.defaultButton,
                isStreaming && styles.opacity60,
              ]}
              disabled={isStreaming}
            >
              <AppText
                style={[
                  styles.actionButtonText,
                  { color: action.pinned ? C.primary : C.text },
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
                style={styles.contextActionButton}
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
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  railContainer: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  headerRow: {
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingText: {
    color: C.muted,
    fontWeight: 'bold',
    flex: 1,
  },
  editingText: {
    color: C.primary,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 12,
  },
  actionButton: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  saveButton: {
    backgroundColor: C.primarySoft,
    borderColor: `${C.primary}55`,
  },
  pinnedButton: {
    backgroundColor: C.primarySoft,
    borderColor: `${C.primary}55`,
  },
  defaultButton: {
    backgroundColor: C.surfaceSoft,
    borderColor: C.border,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  opacity50: {
    opacity: 0.5,
  },
  opacity60: {
    opacity: 0.6,
  },
  contextScrollContent: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  contextActionButton: {
    marginRight: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: C.surfaceSoft,
    borderWidth: 1,
    borderColor: C.border,
  },
  contextActionText: {
    color: C.muted,
    fontWeight: 'bold',
  },
});
