import React, { useMemo, useCallback } from 'react';
import { Pressable, View, FlatList } from 'react-native';
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

// ----------------------------------------------------------------------------
// Render Items for Prompt List
// ----------------------------------------------------------------------------

type PromptListItem = { id: 'save_button' } | { id: string; action: PromptItem };

const PromptListRenderItem = React.memo(
  ({
    item,
    isStreaming,
    canSave,
    saveLabel,
    onSave,
    onPromptPress,
    onPromptLongPress,
  }: {
    item: PromptListItem;
    isStreaming: boolean;
    canSave: boolean;
    saveLabel: string;
    onSave: () => void;
    onPromptPress: (text: string) => void;
    onPromptLongPress: (prompt: PromptItem) => void;
  }) => {
    if ('action' in item) {
      const { action } = item;
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
            className={`text-xs font-bold ${action.pinned ? 'text-[#147D64]' : 'text-[#13251C]'}`}
          >
            {action.pinned ? '★ ' : ''}
            {action.text}
          </AppText>
        </Pressable>
      );
    } else {
      return (
        <Pressable
          onPress={onSave}
          className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
            isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
          }`}
          disabled={isStreaming || !canSave}
        >
          <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
        </Pressable>
      );
    }
  }
);
PromptListRenderItem.displayName = 'PromptListRenderItem';

const promptKeyExtractor = (item: PromptListItem) => item.id;

// ----------------------------------------------------------------------------
// Render Items for Context Actions List
// ----------------------------------------------------------------------------

const ContextActionRenderItem = React.memo(
  ({ value, onContextPress }: { value: string; onContextPress: (val: string) => void }) => {
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
  }
);
ContextActionRenderItem.displayName = 'ContextActionRenderItem';

const contextActionKeyExtractor = (item: string) => item;

// ----------------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------------

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

  const promptData: PromptListItem[] = useMemo(() => {
    return [{ id: 'save_button' } as PromptListItem].concat(
      prompts.map((action) => ({ id: action.id, action }))
    );
  }, [prompts]);

  const renderPromptItem = useCallback(
    ({ item }: { item: PromptListItem }) => (
      <PromptListRenderItem
        item={item}
        isStreaming={isStreaming}
        canSave={canSave}
        saveLabel={saveLabel}
        onSave={onSave}
        onPromptPress={onPromptPress}
        onPromptLongPress={onPromptLongPress}
      />
    ),
    [isStreaming, canSave, saveLabel, onSave, onPromptPress, onPromptLongPress]
  );

  const renderContextActionItem = useCallback(
    ({ item }: { item: string }) => (
      <ContextActionRenderItem value={item} onContextPress={onContextPress || (() => {})} />
    ),
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
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3"
          data={promptData}
          keyExtractor={promptKeyExtractor}
          renderItem={renderPromptItem}
          extraData={{ isStreaming, canSave, saveLabel }}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
            data={contextActions}
            keyExtractor={contextActionKeyExtractor}
            renderItem={renderContextActionItem}
          />
        ) : null}
      </View>
    </View>
  );
});
