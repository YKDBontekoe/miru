import React from 'react';
import { Modal, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';

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
          <AppText variant="h3" className="text-[#13251C] mb-1">
            {title}
          </AppText>
          {subtitle ? (
            <AppText variant="caption" className="text-[#5A7467] mb-3">
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
                className="rounded-xl border border-[#DDE8E0] bg-[#ECF5F0] px-3 py-3"
              >
                <AppText
                  className={`font-semibold ${
                    option.tone === 'destructive' ? 'text-[#B23A3A]' : 'text-[#13251C]'
                  }`}
                >
                  {option.label}
                </AppText>
              </ScalePressable>
            ))}
          </View>
          <ScalePressable onPress={onClose} className="rounded-xl px-3 py-3 mt-3 border border-[#DDE8E0]">
            <AppText className="text-[#5A7467] font-semibold text-center">Close</AppText>
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}
