import React from 'react';
import { View, TextInput, TouchableOpacity, Keyboard } from 'react-native';
import { AppText } from './AppText';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop?: () => void;
  placeholder?: string;
}

export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  isStreaming,
  onStop,
  placeholder = 'Message Miru...',
}: ChatInputBarProps) {
  const handleSend = () => {
    if (value.trim() && !isStreaming) {
      onSend();
      Keyboard.dismiss();
    }
  };

  return (
    <View className="px-lg py-sm border-t border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark flex-row items-end">
      <View className="flex-1 bg-surface-highLight dark:bg-surface-highDark rounded-2xl border border-border-light dark:border-border-dark px-md py-xs">
        <TextInput
          className="text-onSurface-light dark:text-onSurface-dark text-base min-h-[40px] max-h-[120px]"
          placeholder={placeholder}
          placeholderTextColor="#A0A0B0"
          value={value}
          onChangeText={onChangeText}
          multiline
          textAlignVertical="center"
        />
      </View>

      <View className="ml-sm mb-xxs">
        {isStreaming ? (
          <TouchableOpacity
            onPress={onStop}
            className="w-10 h-10 rounded-full bg-status-error/10 items-center justify-center border border-status-error/30"
          >
            <View className="w-3 h-3 bg-status-error rounded-sm" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={handleSend}
            disabled={!value.trim()}
            className={`w-10 h-10 rounded-full items-center justify-center ${value.trim() ? 'bg-primary' : 'bg-onSurface-disabledDark opacity-50'}`}
          >
            <AppText className="text-white font-bold text-xl">↑</AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}
