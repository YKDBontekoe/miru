import React, { useMemo } from 'react';
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

const renderPromptItem = ({ item, extraData }: { item: PromptItem | { id: 'save'; isSave: true }; extraData: any }) => {
  const { onSave, isStreaming, canSave, saveLabel, onPromptPress, onPromptLongPress } = extraData;

  if ('isSave' in item) {
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

  const action = item as PromptItem;
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

const renderContextItem = ({ item, extraData }: { item: string; extraData: any }) => {
  const { onContextPress } = extraData;
  return (
    <Pressable
      onPress={() => onContextPress(item)}
      className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
    >
      <AppText variant="caption" className="text-[#5A7467] font-bold">
        {item}
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

  const promptItems = useMemo(() => [{ id: 'save', isSave: true } as const, ...prompts], [prompts]);
  const promptExtraData = useMemo(
    () => ({ onSave, isStreaming, canSave, saveLabel, onPromptPress, onPromptLongPress }),
    [onSave, isStreaming, canSave, saveLabel, onPromptPress, onPromptLongPress]
  );

  const contextExtraData = useMemo(() => ({ onContextPress }), [onContextPress]);

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
          contentContainerStyle={{ paddingHorizontal: 12 }}
          data={promptItems}
          renderItem={(props) => renderPromptItem({ ...props, extraData: promptExtraData })}
          keyExtractor={(item) => item.id}
          extraData={promptExtraData}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <View className="pt-2">
            <FlatList
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12 }}
              data={contextActions}
              renderItem={(props) => renderContextItem({ ...props, extraData: contextExtraData })}
              keyExtractor={(item) => item}
              extraData={contextExtraData}
            />
          </View>
        ) : null}
      </View>
    </View>
  );
});
