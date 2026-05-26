import React, { memo, useCallback, useMemo } from 'react';
import { Pressable, FlatList, View, StyleSheet } from 'react-native';
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
  container: { paddingHorizontal: 12, paddingBottom: 8 },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#DDE8E0',
    backgroundColor: '#white',
    paddingVertical: 8,
  },
  header: { paddingHorizontal: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center' },
  listContent: { paddingHorizontal: 12 },
  saveButton: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    backgroundColor: '#DDF4EB',
    borderColor: '#147D6455',
  },
  promptButton: {
    marginRight: 8,
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  promptPinned: { backgroundColor: '#DDF4EB', borderColor: '#147D6455' },
  promptUnpinned: { backgroundColor: '#ECF5F0', borderColor: '#DDE8E0' },
  contextList: { paddingHorizontal: 12, paddingTop: 8 },
  contextButton: {
    marginRight: 8,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 7,
    backgroundColor: '#ECF5F0',
    borderWidth: 1,
    borderColor: '#DDE8E0',
  },
});

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
          data={prompts}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <Pressable
              onPress={onSave}
              className={`mr-2 rounded-full px-3 py-2 border bg-[#DDF4EB] border-[#147D6455] ${
                isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
              }`}
              disabled={isStreaming || !canSave}
            >
              <AppText className="text-xs font-bold text-[#147D64]">{saveLabel}</AppText>
            </Pressable>
          }
          renderItem={({ item: action }) => (
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
          )}
        />

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
            data={contextActions}
            keyExtractor={(item) => item}
            renderItem={({ item: value }) => (
              <Pressable
                onPress={() => onContextPress(value)}
                className="mr-2 rounded-xl px-2.5 py-[7px] bg-[#ECF5F0] border border-[#DDE8E0]"
              >
                <AppText variant="caption" className="text-[#5A7467] font-bold">
                  {value}
                </AppText>
              </Pressable>
            )}
          />
        ) : null}
      </View>
    </View>
  );
});
