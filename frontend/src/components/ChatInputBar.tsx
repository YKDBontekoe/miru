import React, { useRef } from 'react';
import { View, TextInput, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const C = {
  bg: '#FFFFFF',
  border: '#E0E0EC',
  inputBg: '#F0F0F6',
  inputBorder: '#E0E0EC',
  text: '#12121A',
  placeholder: '#A0A0B4',
  primary: '#2563EB',
  sendDisabled: '#D0D0DC',
  stopBg: '#FEF2F2',
  stopBorder: '#FECACA',
  stopIcon: '#DC2626',
};

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop?: () => void;
  placeholder?: string;
}

// DOCS(miru-agent): needs documentation
export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  isStreaming,
  onStop,
  placeholder = 'Message...',
}: ChatInputBarProps) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isStreaming;

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    // Keep focus so keyboard stays open for follow-up messages
  };

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        paddingHorizontal: 12,
        paddingVertical: 10,
        paddingBottom: Platform.OS === 'ios' ? 10 : 10,
        backgroundColor: C.bg,
        borderTopWidth: 1,
        borderTopColor: C.border,
        gap: 8,
      }}
    >
      {/* Text input */}
      <View
        style={{
          flex: 1,
          backgroundColor: C.inputBg,
          borderRadius: 22,
          borderWidth: 1,
          borderColor: C.inputBorder,
          paddingHorizontal: 16,
          paddingTop: Platform.OS === 'ios' ? 10 : 8,
          paddingBottom: Platform.OS === 'ios' ? 10 : 8,
          minHeight: 44,
          maxHeight: 130,
          justifyContent: 'center',
        }}
      >
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          multiline
          textAlignVertical="center"
          style={{
            color: C.text,
            fontSize: 16,
            lineHeight: 22,
            padding: 0,
            margin: 0,
          }}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      {/* Action button */}
      {isStreaming ? (
        <TouchableOpacity
          onPress={onStop}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: C.stopBg,
            borderWidth: 1,
            borderColor: C.stopBorder,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.75}
        >
          {/* Stop square */}
          <View style={{ width: 14, height: 14, borderRadius: 3, backgroundColor: C.stopIcon }} />
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={handleSend}
          disabled={!canSend}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: canSend ? C.primary : C.sendDisabled,
            alignItems: 'center',
            justifyContent: 'center',
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}
