import React, { useRef } from 'react';
import { View, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { theme } from '../core/theme';

interface ChatInputBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  isStreaming: boolean;
  onStop?: () => void;
  placeholder?: string;
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
}: ChatInputBarProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

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

  const containerStyle = {
    backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light,
    borderTopColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
  };

  const inputContainerStyle = {
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
  };

  const inputTextStyle = {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    ...theme.typography.body,
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {/* Text input */}
      <View style={[styles.inputContainer, inputContainerStyle]}>
        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight
          }
          multiline
          textAlignVertical="center"
          style={[styles.input, inputTextStyle]}
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
          style={[
            styles.actionButton,
            {
              backgroundColor: isDark
                ? theme.colors.status.errorSurfaceDark
                : theme.colors.status.errorSurfaceLight,
              borderColor: isDark
                ? theme.colors.status.errorSurfaceDark
                : theme.colors.status.errorSurfaceLight, // keep border same to avoid layout shift
            },
            animatedStyle,
          ]}
        >
          {/* Stop square */}
          <View style={[styles.stopSquare, { backgroundColor: theme.colors.status.error }]} />
        </AnimatedPressable>
      ) : (
        <AnimatedPressable
          testID="send-button"
          onPress={handleSend}
          disabled={!canSend}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          style={[
            styles.actionButton,
            {
              backgroundColor: canSend
                ? theme.colors.primary.DEFAULT
                : isDark
                  ? theme.colors.surface.highestDark
                  : theme.colors.onSurface.disabledLight,
            },
            animatedStyle,
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={22}
            color={
              canSend
                ? theme.colors.white
                : isDark
                  ? theme.colors.onSurface.disabledDark
                  : theme.colors.onSurface.disabledLight
            }
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
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderTopWidth: 1,
    gap: theme.spacing.sm,
  },
  inputContainer: {
    flex: 1,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? theme.spacing.md : theme.spacing.sm,
    minHeight: theme.spacing.inputBarMinHeight,
    maxHeight: theme.spacing.inputBarMaxHeight,
    justifyContent: 'center',
  },
  input: {
    padding: 0,
    margin: 0,
  },
  actionButton: {
    width: theme.spacing.inputBarButton,
    height: theme.spacing.inputBarButton,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  stopSquare: {
    width: theme.spacing.inputBarStopSquare,
    height: theme.spacing.inputBarStopSquare,
    borderRadius: theme.borderRadius.xs,
  },
});
