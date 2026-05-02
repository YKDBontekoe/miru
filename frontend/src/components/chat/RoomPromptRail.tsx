import React, { useCallback, useMemo } from 'react';
import { Pressable, FlatList, View, ListRenderItemInfo } from 'react-native';
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

// Extracted render component to prevent memory churn on re-renders
const ContextActionItem = React.memo(({
  value,
  onPress
}: {
  value: string;
  onPress: (v: string) => void
}) => {
  const handlePress = useCallback(() => {
    onPress(value);
  }, [value, onPress]);

  return (
    <Pressable
      onPress={handlePress}
      className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
    >
      <AppText variant="caption" className="text-[#5A7467] font-bold">
        {value}
      </AppText>
    </Pressable>
  );
});
ContextActionItem.displayName = 'ContextActionItem';

const PromptActionItem = React.memo(({
  action,
  isStreaming,
  onPromptPress,
  onPromptLongPress
}: {
  action: PromptItem;
  isStreaming: boolean;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
}) => {
  const handlePress = useCallback(() => {
    onPromptPress(action.text);
  }, [action.text, onPromptPress]);

  const handleLongPress = useCallback(() => {
    onPromptLongPress(action);
  }, [action, onPromptLongPress]);

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={handleLongPress}
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
});
PromptActionItem.displayName = 'PromptActionItem';

// Stable key extractors
const keyExtractorPrompt = (item: PromptItem) => item.id;
const keyExtractorContext = (item: string) => item;

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

  const renderContextItem = useCallback(({ item }: ListRenderItemInfo<string>) => (
    <ContextActionItem value={item} onPress={onContextPress!} />
  ), [onContextPress]);

  const renderPromptItem = useCallback(({ item }: ListRenderItemInfo<PromptItem>) => (
    <PromptActionItem
      action={item}
      isStreaming={isStreaming}
      onPromptPress={onPromptPress}
      onPromptLongPress={onPromptLongPress}
    />
  ), [isStreaming, onPromptPress, onPromptLongPress]);

  const ListHeaderComponent = useMemo(() => (
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
          data={prompts}
          keyExtractor={keyExtractorPrompt}
          renderItem={renderPromptItem}
          ListHeaderComponent={ListHeaderComponent}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
            data={contextActions}
            keyExtractor={keyExtractorContext}
            renderItem={renderContextItem}
          />
        ) : null}
      </View>
    </View>
  );
});
