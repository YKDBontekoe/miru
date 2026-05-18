import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
  surfaceSoft: DESIGN_TOKENS.colors.surfaceSoft,
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

  return (
    <View className="px-3 pb-2">
      <View className="rounded-[18px] border bg-white py-2 shadow-md" style={{ borderColor: C.border }}>
        <View className="px-3 mb-1.5 flex-row items-center">
          <AppText variant="caption" className="font-bold flex-1" style={{ color: C.muted }}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" className="font-bold" style={{ color: C.primary }}>
              {t('chat.editing', { defaultValue: 'Editing' })}
            </AppText>
          ) : null}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="px-3"
        >
          <Pressable
            onPress={onSave}
            className={`mr-2 rounded-full px-3 py-2 border ${
              isStreaming || !canSave ? 'opacity-50' : 'opacity-100'
            }`}
            style={{ backgroundColor: C.primarySoft, borderColor: `${C.primary}55` }}
            disabled={isStreaming || !canSave}
          >
            <AppText className="text-xs font-bold" style={{ color: C.primary }}>{saveLabel}</AppText>
          </Pressable>

          {prompts.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              className={`mr-2 rounded-full px-3 py-2 border ${isStreaming ? 'opacity-60' : 'opacity-100'}`}
              style={{
                backgroundColor: action.pinned ? C.primarySoft : C.surfaceSoft,
                borderColor: action.pinned ? `${C.primary}55` : C.border,
              }}
              disabled={isStreaming}
            >
              <AppText
                className="text-xs font-bold"
                style={{ color: action.pinned ? C.primary : C.text }}
              >
                {action.pinned ? '★ ' : ''}
                {action.text}
              </AppText>
            </Pressable>
          ))}
        </ScrollView>

        {contextActions && contextActions.length > 0 && onContextPress ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="px-3 pt-2"
          >
            {contextActions.map((value) => (
              <Pressable
                key={value}
                onPress={() => onContextPress(value)}
                className="mr-2 rounded-xl px-2.5 py-[7px] border"
                style={{ backgroundColor: C.surfaceSoft, borderColor: C.border }}
              >
                <AppText variant="caption" className="font-bold" style={{ color: C.muted }}>
                  {value}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        ) : null}
      </View>
    </View>
  );
}
