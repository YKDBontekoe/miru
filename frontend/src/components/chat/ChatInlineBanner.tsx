import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

export const ChatInlineBanner = ({ text, tone = 'info' }: ChatInlineBannerProps) => {
  const { C } = useTheme();

  const getToneColors = () => {
    switch (tone) {
      case 'error':
        return { color: C.danger, bg: C.dangerSurface };
      case 'success':
        return { color: C.success, bg: C.successSurface };
      case 'info':
      default:
        return { color: C.muted, bg: C.surfaceHigh };
    }
  };

  const { color, bg } = getToneColors();

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, styles.bgLayer, { backgroundColor: bg }]} />
      <View style={[styles.borderLayer, { borderColor: color, opacity: 0.4 }]} />
      <AppText variant="caption" style={[styles.text, { color }]}>
        {text}
      </AppText>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    paddingHorizontal: theme.spacing.bubblePaddingV,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },
  bgLayer: {
    borderRadius: theme.borderRadius.md,
  },
  borderLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
  },
  text: {
    fontWeight: 'bold',
  },
});
