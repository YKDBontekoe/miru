import React, { useRef } from 'react';
import { View, TextInput, Pressable, Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { theme } from '../core/theme';

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
  placeholder = 'Message...',
}: ChatInputBarProps) {
  const inputRef = useRef<TextInput>(null);
  const canSend = value.trim().length > 0 && !isStreaming;
  const buttonScale = useSharedValue(1);

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handleSend = () => {
    if (!canSend) return;
    onSend();
    // Keep focus so keyboard stays open for follow-up messages
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
          placeholderTextColor={theme.colors.onSurface.mutedLight}
          multiline
          textAlignVertical="center"
          style={styles.textInput}
          returnKeyType="default"
          blurOnSubmit={false}
        />
      </View>

      {/* Action button */}
      {isStreaming ? (
        <Animated.View style={buttonAnimatedStyle}>
          <Pressable
            onPress={onStop}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={styles.stopButton}
          >
            {/* Stop square */}
            <View style={styles.stopIcon} />
          </Pressable>
        </Animated.View>
      ) : (
        <Animated.View style={buttonAnimatedStyle}>
          <Pressable
            onPress={handleSend}
            disabled={!canSend}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            style={[
              styles.sendButton,
              { backgroundColor: canSend ? theme.colors.primary.DEFAULT : theme.colors.onSurface.disabledLight },
            ]}
          >
            <Ionicons name="arrow-up" size={22} color={theme.colors.surface.light} />
          </Pressable>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 10,
    paddingBottom: Platform.OS === 'ios' ? 10 : 10,
    backgroundColor: theme.colors.surface.light,
    borderTopWidth: 1,
    borderTopColor: theme.colors.surface.highestLight,
    gap: theme.spacing.sm,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface.highLight,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: theme.colors.surface.highestLight,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: Platform.OS === 'ios' ? 10 : theme.spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 10 : theme.spacing.sm,
    minHeight: 44,
    maxHeight: 130,
    justifyContent: 'center',
  },
  textInput: {
    color: theme.colors.onSurface.light,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
    padding: theme.spacing.none,
    margin: theme.spacing.none,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.status.errorSurfaceLight,
    borderWidth: 1,
    borderColor: theme.colors.status.errorSurfaceDark,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stopIcon: {
    width: 14,
    height: 14,
    borderRadius: theme.borderRadius.xs,
    backgroundColor: theme.colors.status.error,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
