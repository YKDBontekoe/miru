import React from 'react';
import { StyleSheet, View } from 'react-native';
import { AppText } from '@/components/AppText';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const { C } = useTheme();

  let boxStyle;
  let textStyle;

  switch (tone) {
    case 'error':
      boxStyle = { backgroundColor: C.dangerSurface, borderColor: `${C.danger}66` };
      textStyle = { color: C.danger };
      break;
    case 'success':
      boxStyle = { backgroundColor: C.successSurface, borderColor: `${C.success}66` };
      textStyle = { color: C.success };
      break;
    case 'info':
    default:
      boxStyle = { backgroundColor: C.surfaceMid, borderColor: `${C.muted}66` };
      textStyle = { color: C.muted };
      break;
  }

  return (
    <View style={[styles.container, boxStyle]}>
      <AppText variant="caption" style={[styles.text, textStyle]}>
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
    paddingHorizontal: 10,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontWeight: 'bold',
  },
});
