import React from 'react';
import { Pressable } from 'react-native';
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
    retryScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
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
      style={retryAnimatedStyle}
      className="flex-row items-center gap-1"
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons name="refresh-outline" size={13} color={theme.colors.primary.DEFAULT} />
      <AppText className="text-primary text-[12px] font-semibold">{t('chat.retry')}</AppText>
    </AnimatedPressable>
  );
};
