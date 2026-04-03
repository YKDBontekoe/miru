import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { AppText } from '@/components/AppText';
import { theme } from '@/core/theme';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface ChatBubbleRetryButtonProps {
  onRetry: () => void;
}

export const ChatBubbleRetryButton = ({ onRetry }: ChatBubbleRetryButtonProps) => {
  const { t } = useTranslation();
  const retryScale = useSharedValue(1);

  const handleRetryPressIn = () => {
    retryScale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handleRetryPressOut = () => {
    retryScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  return (
    <AnimatedPressable
      testID="retry-button"
      onPress={onRetry}
      onPressIn={handleRetryPressIn}
      onPressOut={handleRetryPressOut}
      style={[styles.container, retryAnimatedStyle]}
      hitSlop={{
        top: theme.spacing.md,
        bottom: theme.spacing.md,
        left: theme.spacing.md,
        right: theme.spacing.md,
      }}
    >
      <Ionicons
        name="refresh-outline"
        size={theme.spacing.lg}
        color={theme.colors.primary.DEFAULT}
      />
      <AppText style={styles.text}>{t('chat.retry')}</AppText>
    </AnimatedPressable>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xxs,
  },
  text: {
    ...theme.typography.caption,
    color: theme.colors.primary.DEFAULT,
    fontWeight: '600',
  },
});
