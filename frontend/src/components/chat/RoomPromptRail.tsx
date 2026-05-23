import React, { memo, useCallback } from 'react';
import { Pressable, FlatList, View, StyleSheet, ListRenderItemInfo } from 'react-native';
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

const styles = StyleSheet.create({
  flatListContent: {
    paddingHorizontal: 12,
  },
  actionItem: {
    marginRight: 8,
  }
});

const MemoizedPromptItem = memo(({
  action,
  isStreaming,
  onPress,
  onLongPress,
}: {
  action: PromptItem;
  isStreaming: boolean;
  onPress: (text: string) => void;
  onLongPress: (prompt: PromptItem) => void;
}) => {
  return (
    <View style={styles.actionItem}>
      <Pressable
        onPress={() => onPress(action.text)}
        onLongPress={() => onLongPress(action)}
        className={`rounded-full px-3 py-2 border ${
          action.pinned
            ? 'bg-[#DDF4EB] border-[#147D6455] text-[#147D64]'
            : 'bg-[#ECF5F0] border-[#DDE8E0] text-[#13251C]'
        } ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
        disabled={isStreaming}
      >
        <AppText
          className={`text-xs font-bold ${
            action.pinned ? 'text-[#147D64]' : 'text-[#13251C]'
          }`}
        >
          {action.pinned ? '★ ' : ''}
          {action.text}
        </AppText>
      </Pressable>
    </View>
  );
});

MemoizedPromptItem.displayName = 'MemoizedPromptItem';

const MemoizedContextAction = memo(({
  value,
  onPress,
}: {
  value: string;
  onPress: (value: string) => void;
}) => {
  return (
    <View style={styles.actionItem}>
      <Pressable
        onPress={() => onPress(value)}
        className="rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
      >
        <AppText variant="caption" className="text-[#5A7467] font-bold">
          {value}
        </AppText>
      </Pressable>
    </View>
  );
});

MemoizedContextAction.displayName = 'MemoizedContextAction';

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

  const renderPromptItem = useCallback(({ item }: ListRenderItemInfo<PromptItem>) => (
    <MemoizedPromptItem
      action={item}
      isStreaming={isStreaming}
      onPress={onPromptPress}
      onLongPress={onPromptLongPress}
    />
  ), [isStreaming, onPromptPress, onPromptLongPress]);

  const renderContextAction = useCallback(({ item }: ListRenderItemInfo<string>) => {
    if (!onContextPress) return null;
    return <MemoizedContextAction value={item} onPress={onContextPress} />;
  }, [onContextPress]);

  const SaveButtonHeader = useCallback(() => (
    <View style={styles.actionItem}>
      <Pressable
        onPress={onSave}
        className={`rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
          isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
        }`}
        disabled={isStreaming || !canSave}
      >
        <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
      </Pressable>
    </View>
  ), [isStreaming, canSave, onSave, saveLabel]);

  const promptKeyExtractor = useCallback((item: PromptItem) => item.id, []);
  const contextActionKeyExtractor = useCallback((item: string) => item, []);

  return (
    <View className="px-3 pb-2">
      <View className="rounded-[18px] border border-[#DDE8E0] bg-white py-2 shadow-md">
        <View className="px-3 mb-1.5 flex-row items-center">
          <AppText variant="caption" className="text-[#5A7467] font-bold flex-1">
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" className="text-[#147D64] font-bold">
              {t('chat.editing', { defaultValue: 'Editing' })}
            </AppText>
          ) : null}
        </View>

        <FlatList
          data={prompts}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          renderItem={renderPromptItem}
          keyExtractor={promptKeyExtractor}
          ListHeaderComponent={SaveButtonHeader}
          extraData={isStreaming}
          initialNumToRender={5}
          maxToRenderPerBatch={10}
          windowSize={5}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <View className="pt-2">
            <FlatList
              data={contextActions}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.flatListContent}
              renderItem={renderContextAction}
              keyExtractor={contextActionKeyExtractor}
              initialNumToRender={5}
              maxToRenderPerBatch={10}
              windowSize={5}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
}
