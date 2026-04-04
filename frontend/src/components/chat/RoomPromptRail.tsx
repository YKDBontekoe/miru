import React from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

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

const C = {
  border: DESIGN_TOKENS.colors.border,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
};

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
  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 8 }}>
      <View
        style={{
          borderRadius: 18,
          borderWidth: 1,
          borderColor: C.border,
          backgroundColor: C.surface,
          paddingVertical: 8,
          ...DESIGN_TOKENS.shadow,
        }}
      >
        <View style={{ paddingHorizontal: 12, marginBottom: 6, flexDirection: 'row', alignItems: 'center' }}>
          <AppText variant="caption" style={{ color: C.muted, fontWeight: '700', flex: 1 }}>
            {heading}
          </AppText>
          {isEditing ? (
            <AppText variant="caption" style={{ color: C.primary, fontWeight: '700' }}>
              Editing
            </AppText>
          ) : null}
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 12 }}
        >
          <Pressable
            onPress={onSave}
            style={{
              marginRight: 8,
              borderRadius: 999,
              paddingHorizontal: 12,
              paddingVertical: 8,
              backgroundColor: C.primarySoft,
              borderWidth: 1,
              borderColor: `${C.primary}35`,
              opacity: isStreaming || !canSave ? 0.5 : 1,
            }}
            disabled={isStreaming || !canSave}
          >
            <AppText style={{ fontSize: 12, fontWeight: '700', color: C.primary }}>{saveLabel}</AppText>
          </Pressable>

          {prompts.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => onPromptPress(action.text)}
              onLongPress={() => onPromptLongPress(action)}
              style={{
                marginRight: 8,
                borderRadius: 999,
                paddingHorizontal: 12,
                paddingVertical: 8,
                backgroundColor: action.pinned ? C.primarySoft : C.surfaceHigh,
                borderWidth: 1,
                borderColor: action.pinned ? `${C.primary}35` : C.border,
                opacity: isStreaming ? 0.6 : 1,
              }}
              disabled={isStreaming}
            >
              <AppText
                style={{
                  fontSize: 12,
                  fontWeight: '700',
                  color: action.pinned ? C.primary : C.text,
                }}
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
            contentContainerStyle={{ paddingHorizontal: 12, paddingTop: 8 }}
          >
            {contextActions.map((value) => (
              <Pressable
                key={value}
                onPress={() => onContextPress(value)}
                style={{
                  marginRight: 8,
                  borderRadius: 12,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  backgroundColor: C.surfaceHigh,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <AppText variant="caption" style={{ color: C.muted, fontWeight: '700' }}>
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
