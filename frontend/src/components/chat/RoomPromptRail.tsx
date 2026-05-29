import React, { memo, useCallback } from 'react';
import { Pressable, FlatList, View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

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

const renderContextAction = ({ item, onContextPress }: { item: string, onContextPress?: (value: string) => void }) => (
  <Pressable
    onPress={() => onContextPress?.(item)}
    style={styles.contextActionItem}
  >
    <AppText variant="caption" style={styles.contextActionText}>
      {item}
    </AppText>
  </Pressable>
);

const renderPromptItem = ({
  item,
  isStreaming,
  onPromptPress,
  onPromptLongPress
}: {
  item: PromptItem | { isSaveBtn: true };
  isStreaming: boolean;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
}) => {
  if ('isSaveBtn' in item) {
    return null; // The save button is handled in ListHeaderComponent
  }
  return (
    <Pressable
      onPress={() => onPromptPress(item.text)}
      onLongPress={() => onPromptLongPress(item)}
      style={[
        styles.promptItem,
        item.pinned ? styles.promptItemPinned : styles.promptItemUnpinned,
        isStreaming && styles.opacity60
      ]}
      disabled={isStreaming}
    >
      <AppText
        style={[
          styles.promptItemText,
          item.pinned ? styles.promptTextPinned : styles.promptTextUnpinned
        ]}
      >
        {item.pinned ? '★ ' : ''}
        {item.text}
      </AppText>
    </Pressable>
  );
};

export const RoomPromptRail = memo(({
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

  const handleRenderContextAction = useCallback(
    ({ item }: { item: string }) => renderContextAction({ item, onContextPress }),
    [onContextPress]
  );

  const handleRenderPromptItem = useCallback(
    ({ item }: { item: PromptItem }) => renderPromptItem({ item, isStreaming, onPromptPress, onPromptLongPress }),
    [isStreaming, onPromptPress, onPromptLongPress]
  );

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.header}>
          <AppText variant="caption" style={styles.headingText}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" style={styles.editingText}>
              {t('chat.editing', { defaultValue: 'Editing' })}
            </AppText>
          ) : null}
        </View>

        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.promptsList}
          data={prompts}
          keyExtractor={(item) => item.id}
          renderItem={handleRenderPromptItem}
          ListHeaderComponent={
            <Pressable
              onPress={onSave}
              style={[
                styles.saveButton,
                isStreaming || !canSave ? styles.opacity50 : styles.opacity100
              ]}
              disabled={isStreaming || !canSave}
            >
              <AppText style={styles.saveButtonText}>{saveLabel}</AppText>
            </Pressable>
          }
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.contextActionsList}
            data={contextActions}
            keyExtractor={(item) => item}
            renderItem={handleRenderContextAction}
          />
        ) : null}
      </View>
    </View>
  );
});
RoomPromptRail.displayName = 'RoomPromptRail';

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE8E0',
    backgroundColor: 'white',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    paddingHorizontal: 12,
    marginBottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headingText: {
    color: '#5A7467',
    fontWeight: 'bold',
    flex: 1,
  },
  editingText: {
    color: '#147D64',
    fontWeight: 'bold',
  },
  promptsList: {
    paddingHorizontal: 12,
  },
  saveButton: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: '#DDF4EB',
    borderColor: '#147D6455',
  },
  opacity50: {
    opacity: 0.5,
  },
  opacity60: {
    opacity: 0.6,
  },
  opacity100: {
    opacity: 1,
  },
  saveButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#147D64',
  },
  promptItem: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  promptItemPinned: {
    backgroundColor: '#DDF4EB',
    borderColor: '#147D6455',
  },
  promptItemUnpinned: {
    backgroundColor: '#ECF5F0',
    borderColor: '#DDE8E0',
  },
  promptItemText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  promptTextPinned: {
    color: '#147D64',
  },
  promptTextUnpinned: {
    color: '#13251C',
  },
  contextActionsList: {
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  contextActionItem: {
    marginRight: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#ECF5F0',
    borderWidth: 1,
    borderColor: '#DDE8E0',
  },
  contextActionText: {
    color: '#5A7467',
    fontWeight: 'bold',
  },
});
