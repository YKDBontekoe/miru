import React, { useRef } from 'react';
import { View, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

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

export const ChatInputBar = React.memo(function ChatInputBar({
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

  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <View style={styles.container}>
      {/* Text input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          multiline
          textAlignVertical="center"
          style={styles.input}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      {/* Action button */}
      {isStreaming ? (
        <Pressable onPress={onStop} onPressIn={handlePressIn} onPressOut={handlePressOut}>
          <Animated.View style={[styles.stopButton, animatedStyle]}>
            <View style={styles.stopIcon} />
          </Animated.View>
        </Pressable>
      ) : (
        <Pressable
          onPress={handleSend}
          disabled={!canSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View
            style={[
              styles.sendButton,
              animatedStyle,
              { backgroundColor: canSend ? C.primary : C.sendDisabled },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color="#FFFFFF" />
          </Animated.View>
        </Pressable>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: C.bg,
    borderTopWidth: 1,
    borderTopColor: C.border,
    gap: 8,
  },
  inputContainer: {
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
  },
  input: {
    color: C.text,
    fontSize: 16,
    lineHeight: 22,
    padding: 0,
    margin: 0,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: C.stopBg,
    borderWidth: 1,
    borderColor: C.stopBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: C.stopIcon,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
