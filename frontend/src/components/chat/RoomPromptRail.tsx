import React, { useCallback, useMemo } from 'react';
import { Pressable, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

interface PromptItem {
  id: string;
  text: string;
  pinned: boolean;
}

const keyExtractorPrompt = (item: PromptItem) => item.id;
const keyExtractorContextAction = (item: string) => item;

const RenderPromptItem = React.memo(({
  item,
  isStreaming,
  onPromptPress,
  onPromptLongPress
}: {
  item: PromptItem;
  isStreaming: boolean;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
}) => (
  <Pressable
    onPress={() => onPromptPress(item.text)}
    onLongPress={() => onPromptLongPress(item)}
    className={`mr-2 rounded-full px-3 py-2 border ${
      item.pinned
        ? 'bg-[#DDF4EB] border-[#147D6455] text-[#147D64]'
        : 'bg-[#ECF5F0] border-[#DDE8E0] text-[#13251C]'
    } ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
    disabled={isStreaming}
  >
    <AppText
      className={`text-xs font-bold ${
        item.pinned ? 'text-[#147D64]' : 'text-[#13251C]'
      }`}
    >
      {item.pinned ? '★ ' : ''}
      {item.text}
    </AppText>
  </Pressable>
));
RenderPromptItem.displayName = 'RenderPromptItem';

const RenderContextActionItem = React.memo(({
  item,
  onContextPress
}: {
  item: string;
  onContextPress: (value: string) => void;
}) => (
  <Pressable
    onPress={() => onContextPress(item)}
    className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
  >
    <AppText variant="caption" className="text-[#5A7467] font-bold">
      {item}
    </AppText>
  </Pressable>
));
RenderContextActionItem.displayName = 'RenderContextActionItem';

const ListHeaderSaveButton = React.memo(({
  onSave,
  isStreaming,
  canSave,
  saveLabel,
}: {
  onSave: () => void;
  isStreaming: boolean;
  canSave: boolean;
  saveLabel: string;
}) => (
  <Pressable
    onPress={onSave}
    className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
      isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
    }`}
    disabled={isStreaming || !canSave}
  >
    <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
  </Pressable>
));
ListHeaderSaveButton.displayName = 'ListHeaderSaveButton';

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

  const renderPromptItem = useCallback(({ item }: { item: PromptItem }) => (
    <RenderPromptItem
      item={item}
      isStreaming={isStreaming}
      onPromptPress={onPromptPress}
      onPromptLongPress={onPromptLongPress}
    />
  ), [isStreaming, onPromptPress, onPromptLongPress]);

  const renderContextActionItem = useCallback(({ item }: { item: string }) => {
    if (!onContextPress) return null;
    return <RenderContextActionItem item={item} onContextPress={onContextPress} />;
  }, [onContextPress]);

  const listHeaderSaveButton = useMemo(() => (
    <ListHeaderSaveButton
      onSave={onSave}
      isStreaming={isStreaming}
      canSave={canSave}
      saveLabel={saveLabel}
    />
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
          data={prompts}
          keyExtractor={keyExtractorPrompt}
          renderItem={renderPromptItem}
          ListHeaderComponent={listHeaderSaveButton}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <View className="pt-2">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerClassName="px-3"
              data={contextActions}
              keyExtractor={keyExtractorContextAction}
              renderItem={renderContextActionItem}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});
RoomPromptRail.displayName = 'RoomPromptRail';
