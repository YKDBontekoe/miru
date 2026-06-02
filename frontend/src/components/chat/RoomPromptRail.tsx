import React, { useCallback, useMemo } from 'react';
import { Pressable, FlatList, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';

interface PromptItem {
  id: string;
  text: string;
  pinned: boolean;
}

const PromptItemComponent = React.memo(({
  action,
  isStreaming,
  onPromptPress,
  onPromptLongPress,
}: {
  action: PromptItem;
  isStreaming: boolean;
  onPromptPress: (text: string) => void;
  onPromptLongPress: (prompt: PromptItem) => void;
}) => (
  <Pressable
    onPress={() => onPromptPress(action.text)}
    onLongPress={() => onPromptLongPress(action)}
    className={`mr-2 rounded-full px-3 py-2 border ${
      action.pinned
        ? 'bg-[#DDF4EB] border-[#147D6455] text-[#147D64]'
        : 'bg-[#ECF5F0] border-[#DDE8E0] text-[#13251C]'
    } ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
    disabled={isStreaming}
    accessibilityRole="button"
    accessibilityLabel={action.text}
    accessibilityState={{ disabled: isStreaming }}
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
));
PromptItemComponent.displayName = 'PromptItemComponent';

const ContextActionComponent = React.memo(({
  label,
  onPress,
}: {
  label: string;
  onPress: (value: string) => void;
}) => (
  <Pressable
    onPress={() => onPress(label)}
    className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
    accessibilityRole="button"
    accessibilityLabel={label}
  >
    <AppText variant="caption" className="text-[#5A7467] font-bold">
      {label}
    </AppText>
  </Pressable>
));
ContextActionComponent.displayName = 'ContextActionComponent';

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

  const renderPrompt = useCallback(
    ({ item }: { item: PromptItem | 'save_button' }) => {
      if (item === 'save_button') {
        return (
          <Pressable
            onPress={onSave}
            className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
              isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
            }`}
            disabled={isStreaming || !canSave}
            accessibilityRole="button"
            accessibilityLabel={saveLabel}
            accessibilityState={{ disabled: isStreaming || !canSave }}
          >
            <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
          </Pressable>
        );
      }
      return (
        <PromptItemComponent
          action={item}
          isStreaming={isStreaming}
          onPromptPress={onPromptPress}
          onPromptLongPress={onPromptLongPress}
        />
      );
    },
    [isStreaming, canSave, onSave, saveLabel, onPromptPress, onPromptLongPress]
  );

  const promptKeyExtractor = useCallback((item: PromptItem | 'save_button') => {
    return item === 'save_button' ? 'save_button' : item.id;
  }, []);

  const promptsData = useMemo(() => {
    return ['save_button' as const, ...prompts];
  }, [prompts]);

  const contextActionsData = useMemo(() => {
    if (!contextActions) return [];
    return contextActions.map((label, index) => ({ id: `context-${index}-${label}`, label }));
  }, [contextActions]);

  const renderContextAction = useCallback(
    ({ item }: { item: { id: string; label: string } }) => {
      return (
        <ContextActionComponent
          label={item.label}
          onPress={onContextPress!}
        />
      );
    },
    [onContextPress]
  );

  const contextActionKeyExtractor = useCallback((item: { id: string; label: string }) => item.id, []);

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
          data={promptsData}
          keyExtractor={promptKeyExtractor}
          renderItem={renderPrompt}
        />

        {contextActionsData.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
            data={contextActionsData}
            keyExtractor={contextActionKeyExtractor}
            renderItem={renderContextAction}
          />
        ) : null}
      </View>
    </View>
  );
});
RoomPromptRail.displayName = 'RoomPromptRail';
