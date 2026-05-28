import React, { useCallback } from 'react';
import { Pressable, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
const C = {
  bgPromptPinned: '#DDF4EB',
  borderPromptPinned: '#147D6455',
  textPromptPinned: '#147D64',
  bgPrompt: '#ECF5F0',
  borderPrompt: '#DDE8E0',
  textPrompt: '#13251C',
  muted: '#5A7467',
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

const PromptItemCell = React.memo(({
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
    className={`mr-2 rounded-full px-3 py-2 border ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
    style={{
      backgroundColor: item.pinned ? C.bgPromptPinned : C.bgPrompt,
      borderColor: item.pinned ? C.borderPromptPinned : C.borderPrompt,
    }}
    disabled={isStreaming}
  >
    <AppText
      className="text-xs font-bold"
      style={{ color: item.pinned ? C.textPromptPinned : C.textPrompt }}
    >
      {item.pinned ? '★ ' : ''}
      {item.text}
    </AppText>
  </Pressable>
));

const ContextActionCell = React.memo(({
  value,
  onContextPress
}: {
  value: string;
  onContextPress: (value: string) => void;
}) => (
  <Pressable
    onPress={() => onContextPress(value)}
    className="mr-2 rounded-xl px-2.5 py-[7px] border"
    style={{ backgroundColor: C.bgPrompt, borderColor: C.borderPrompt }}
  >
    <AppText variant="caption" className="font-bold" style={{ color: C.muted }}>
      {value}
    </AppText>
  </Pressable>
));

export const RoomPromptRail = React.memo(({
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

  const renderPromptItem = useCallback(({ item }: { item: PromptItem }) => (
    <PromptItemCell
      item={item}
      isStreaming={isStreaming}
      onPromptPress={onPromptPress}
      onPromptLongPress={onPromptLongPress}
    />
  ), [isStreaming, onPromptPress, onPromptLongPress]);

  const renderContextAction = useCallback(({ item }: { item: string }) => {
    if (!onContextPress) return null;
    return <ContextActionCell value={item} onContextPress={onContextPress} />;
  }, [onContextPress]);

  const promptKeyExtractor = useCallback((item: PromptItem) => item.id, []);
  const contextKeyExtractor = useCallback((item: string) => item, []);

  const ListHeader = useCallback(() => (
    <Pressable
      onPress={onSave}
      className={`mr-2 rounded-full px-3 py-2 border ${
        isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
      }`}
      style={{ backgroundColor: C.bgPromptPinned, borderColor: C.borderPromptPinned }}
      disabled={isStreaming || !canSave}
    >
      <AppText className="text-xs font-bold" style={{ color: C.textPromptPinned }}>{saveLabel}</AppText>
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
          data={prompts}
          keyExtractor={promptKeyExtractor}
          renderItem={renderPromptItem}
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3"
          ListHeaderComponent={ListHeader}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            data={contextActions}
            keyExtractor={contextKeyExtractor}
            renderItem={renderContextAction}
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
          />
        ) : null}
      </View>
    </View>
  );
});
PromptItemCell.displayName = 'PromptItemCell';
ContextActionCell.displayName = 'ContextActionCell';
RoomPromptRail.displayName = 'RoomPromptRail';
