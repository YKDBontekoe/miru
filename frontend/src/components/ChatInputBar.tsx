import React, { useRef } from 'react';
import { View, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { DESIGN_TOKENS } from '@/core/design/tokens';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop?: () => void;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/**
 * A text input bar for sending messages in a chat interface.
 *
 * Features an auto-expanding multi-line text input, a dynamic send/stop button
 * with tap animations, and support for light/dark themes.
 *
 * @param props.value - The current text value of the input.
 * @param props.onChangeText - Callback invoked when the text input value changes.
 * @param props.onSend - Callback invoked when the user taps the send button.
 * @param props.isStreaming - If true, replaces the send button with a stop button.
 * @param props.onStop - Callback invoked when the user taps the stop button while streaming.
 * @param props.placeholder - Optional placeholder text (defaults to 'Message...').
 */
export function ChatInputBar({
  value,
  onChangeText,
  onSend,
  isStreaming,
  onStop,
  placeholder = 'Message...',
  className,
  inputClassName,
}: ChatInputBarProps) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isStreaming;

  const scale = useSharedValue(1);

  const handlePressIn = () => {
    if (canSend || isStreaming) {
      scale.value = withSpring(0.9, { damping: 15, stiffness: 300 });
    }
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    // Keep focus so keyboard stays open for follow-up messages
  };

  const sendToneClass = canSend
    ? 'bg-[#147D64] border-[#147D64]'
    : 'bg-[#ECF5F0] border-[#DDE8E0]';
  const stopToneClass = 'bg-[#FCEEEE] border-[#F4D1D1]';

  return (
    <View style={styles.container} className={className}>
      {/* Text input */}
      <View style={styles.inputContainer}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={DESIGN_TOKENS.colors.faint}
          multiline
          textAlignVertical="center"
          style={styles.input}
          className={inputClassName}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      {/* Action button */}
      {isStreaming ? (
        <AnimatedPressable
          testID="stop-button"
          onPress={onStop}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={stopToneClass}
          style={[
            styles.actionButton,
            animatedStyle,
          ]}
        >
          {/* Stop square */}
          <View style={[styles.stopSquare, { backgroundColor: DESIGN_TOKENS.colors.destructive }]} />
        </AnimatedPressable>
      ) : (
        <AnimatedPressable
          testID="send-button"
          onPress={handleSend}
          disabled={!canSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          className={sendToneClass}
          style={[
            styles.actionButton,
            animatedStyle,
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={22}
            color={canSend ? DESIGN_TOKENS.colors.white : DESIGN_TOKENS.colors.faint}
          />
        </AnimatedPressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 12,
    borderTopWidth: 1,
    borderTopColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surface,
    gap: 8,
  },
  inputContainer: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: DESIGN_TOKENS.colors.border,
    backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'ios' ? 10 : 8,
    paddingBottom: Platform.OS === 'ios' ? 10 : 8,
    minHeight: 48,
    maxHeight: 132,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    margin: 0,
    fontSize: 15,
    lineHeight: 20,
    color: DESIGN_TOKENS.colors.text,
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  stopSquare: {
    width: 12,
    height: 12,
    borderRadius: 3,
  },
});
