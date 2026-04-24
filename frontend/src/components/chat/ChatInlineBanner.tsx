import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const { C } = useTheme();

  const getToneColors = () => {
    switch (tone) {
      case 'error':
        return {
          bg: C.dangerSurface,
          border: `${C.danger}66`,
          text: C.danger,
        };
      case 'success':
        return {
          bg: C.successSurface,
          border: `${C.success}66`,
          text: C.success,
        };
      case 'info':
      default:
        return {
          bg: C.surfaceHigh,
          border: C.border,
          text: C.subtext,
        };
    }
  };

  const colors = getToneColors();

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, borderColor: colors.border }]}>
      <AppText variant="caption" style={[styles.text, { color: colors.text }]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.sm + 2,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontWeight: 'bold',
  },
});
