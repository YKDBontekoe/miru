import React from 'react';
import { Modal, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  border: DESIGN_TOKENS.colors.border,
  surfaceSoft: DESIGN_TOKENS.colors.surfaceSoft,
  destructive: DESIGN_TOKENS.colors.destructive,
};

export interface ChatActionSheetOption {
  id: string;
  label: string;
  tone?: 'default' | 'destructive';
  onPress: () => void;
}

interface ChatActionSheetProps {
  visible: boolean;
  title: string;
  subtitle?: string;
  options: ChatActionSheetOption[];
  onClose: () => void;
}

export function ChatActionSheet({
  visible,
  title,
  subtitle,
  options,
  onClose,
}: ChatActionSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/35">
        <View className="rounded-t-[24px] bg-white p-4 max-h-[70%]">
          <AppText variant="h3" className="mb-1" style={{ color: C.text }}>
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" className="mb-3" style={{ color: C.muted }}>
              {subtitle}
            </AppText>
          ) : null}
          <View className="gap-2">
            {options.map((option) => (
              <ScalePressable
                key={option.id}
                onPress={() => {
                  onClose();
                  option.onPress();
                }}
                className="rounded-xl border px-3 py-3"
                style={{ borderColor: C.border, backgroundColor: C.surfaceSoft }}
              >
                <AppText
                  className="font-semibold"
                  style={{ color: option.tone === 'destructive' ? C.destructive : C.text }}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
          <ScalePressable onPress={onClose} className="rounded-xl px-3 py-3 mt-3 border" style={{ borderColor: C.border }}>
            <AppText className="font-semibold text-center" style={{ color: C.muted }}>Close</AppText>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}
