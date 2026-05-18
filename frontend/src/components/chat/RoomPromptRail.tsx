import React, { useMemo, useCallback } from 'react';
import { Pressable, FlatList, View } from 'react-native';
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

const renderPromptItem = ({ item }: { item: { action: PromptItem, isStreaming: boolean, onPromptPress: (text: string) => void, onPromptLongPress: (prompt: PromptItem) => void } }) => (
  <Pressable
    onPress={() => item.onPromptPress(item.action.text)}
    onLongPress={() => item.onPromptLongPress(item.action)}
    className={`mr-2 rounded-full px-3 py-2 border ${
      item.action.pinned
        ? 'bg-[#DDF4EB] border-[#147D6455] text-[#147D64]'
        : 'bg-[#ECF5F0] border-[#DDE8E0] text-[#13251C]'
    } ${item.isStreaming ? 'opacity-60' : 'opacity-100'}`}
    disabled={item.isStreaming}
  >
    <AppText
      className={`text-xs font-bold ${
        item.action.pinned ? 'text-[#147D64]' : 'text-[#13251C]'
      }`}
    >
      {item.action.pinned ? '★ ' : ''}
      {item.action.text}
    </AppText>
  </Pressable>
);

const renderContextActionItem = ({ item }: { item: { value: string, onContextPress: (value: string) => void } }) => (
  <Pressable
    onPress={() => item.onContextPress(item.value)}
    className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
  >
    <AppText variant="caption" className="text-[#5A7467] font-bold">
      {item.value}
    </AppText>
  </Pressable>
);

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

  const promptItems = useMemo(() => {
    return prompts.map(action => ({
      action,
      isStreaming,
      onPromptPress,
      onPromptLongPress
    }));
  }, [prompts, isStreaming, onPromptPress, onPromptLongPress]);

  const contextItems = useMemo(() => {
    if (!contextActions || !onContextPress) return [];
    return contextActions.map(value => ({ value, onContextPress }));
  }, [contextActions, onContextPress]);

  const renderPromptHeader = useCallback(() => (
    <Pressable
      onPress={onSave}
      className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
        isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
      }`}
      disabled={isStreaming || !canSave}
    >
      <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
    </Pressable>
  ), [onSave, isStreaming, canSave, saveLabel]);

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
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-3"
          data={promptItems}
          keyExtractor={(item, index) => `${item.action.id}-${index}`}
          renderItem={renderPromptItem}
          ListHeaderComponent={renderPromptHeader}
          extraData={isStreaming}
        />

        {contextItems.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            className="px-3 pt-2"
            data={contextItems}
            keyExtractor={(item, index) => `${item.value}-${index}`}
            renderItem={renderContextActionItem}
          />
        ) : null}
      </View>
    </View>
  );
}
