import React, { memo, useCallback } from 'react';
import { Pressable, FlatList, View, ListRenderItemInfo } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

export interface PromptItem {
  id: string;
  text: string;
  pinned: boolean;
}

export interface RoomPromptRailProps {
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

const renderContextActionItem = (
  { item: value }: ListRenderItemInfo<string>,
  onContextPress: ((value: string) => void) | undefined
) => (
  <Pressable
    onPress={() => onContextPress?.(value)}
    className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
  >
    <AppText variant="caption" className="text-[#5A7467] font-bold">
      {value}
    </AppText>
  </Pressable>
);

const renderPromptItem = (
  { item: action }: ListRenderItemInfo<PromptItem>,
  onPromptPress: (text: string) => void,
  onPromptLongPress: (prompt: PromptItem) => void,
  isStreaming: boolean
) => (
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

const keyExtractorPrompt = (item: PromptItem) => item.id;
const keyExtractorContext = (item: string) => item;

export const RoomPromptRail = memo(function RoomPromptRail({
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

  const renderPrompt = useCallback(
    (info: ListRenderItemInfo<PromptItem>) =>
      renderPromptItem(info, onPromptPress, onPromptLongPress, isStreaming),
    [onPromptPress, onPromptLongPress, isStreaming]
  );

  const renderContext = useCallback(
    (info: ListRenderItemInfo<string>) => renderContextActionItem(info, onContextPress),
    [onContextPress]
  );

  const renderHeader = useCallback(
    () => (
      <Pressable
        onPress={onSave}
        className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
          isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
        }`}
        disabled={isStreaming || !canSave}
      >
        <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
      </Pressable>
    ),
    [onSave, isStreaming, canSave, saveLabel]
  );

  const promptsExtra = React.useMemo(
    () => ({ isStreaming, onPromptPress, onPromptLongPress }),
    [isStreaming, onPromptPress, onPromptLongPress]
  );

  const contextExtra = React.useMemo(
    () => ({ onContextPress }),
    [onContextPress]
  );

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
          contentContainerClassName="px-3"
          keyExtractor={keyExtractorPrompt}
          renderItem={renderPrompt}
          ListHeaderComponent={renderHeader}
          extraData={promptsExtra}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            data={contextActions}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
            keyExtractor={keyExtractorContext}
            renderItem={renderContext}
            extraData={contextExtra}
          />
        ) : null}
      </View>
    </View>
  );
});
