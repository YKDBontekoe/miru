import React, { useCallback, useMemo } from 'react';
import { FlatList, Pressable, View } from 'react-native';
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

interface PromptItemData {
  item: PromptItem;
  isStreaming: boolean;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
}

const renderPromptItem = ({ item: data }: { item: PromptItemData }) => {
  const { item: action, isStreaming, onPromptPress, onPromptLongPress } = data;
  return (
    <Pressable
      onPress={() => onPromptPress(action.text)}
      onLongPress={() => onPromptLongPress(action)}
      className={`mr-2 rounded-full px-3 py-2 border ${
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
  );
};

interface ContextActionData {
  item: string;
  onContextPress: (value: string) => void;
}

const renderContextActionItem = ({ item: data }: { item: ContextActionData }) => {
  const { item: value, onContextPress } = data;
  return (
    <Pressable
      onPress={() => onContextPress(value)}
      className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
    >
      <AppText variant="caption" className="text-[#5A7467] font-bold">
        {value}
      </AppText>
    </Pressable>
  );
};

export const RoomPromptRail = React.memo(function RoomPromptRail({
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

  const promptData: PromptItemData[] = useMemo(
    () =>
      prompts.map((p) => ({
        item: p,
        isStreaming,
        onPromptPress,
        onPromptLongPress,
      })),
    [prompts, isStreaming, onPromptPress, onPromptLongPress]
  );

  const contextData: ContextActionData[] = useMemo(
    () =>
      contextActions && onContextPress
        ? contextActions.map((c) => ({
            item: c,
            onContextPress,
          }))
        : [],
    [contextActions, onContextPress]
  );

  const keyExtractorPrompt = useCallback((data: PromptItemData) => data.item.id, []);
  const keyExtractorContext = useCallback((data: ContextActionData) => data.item, []);

  const ListHeaderComponent = useCallback(() => (
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
          contentContainerClassName="px-3"
          data={promptData}
          renderItem={renderPromptItem}
          keyExtractor={keyExtractorPrompt}
          ListHeaderComponent={ListHeaderComponent}
        />

        {contextData.length > 0 ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
            data={contextData}
            renderItem={renderContextActionItem}
            keyExtractor={keyExtractorContext}
          />
        ) : null}
      </View>
    </View>
  );
});
