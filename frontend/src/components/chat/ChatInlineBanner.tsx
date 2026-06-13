import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

const TONE_CLASSES = {
  error: {
    backgroundColor: DESIGN_TOKENS.colors.destructiveSurface,
    borderColor: DESIGN_TOKENS.colors.destructiveBorder,
    color: DESIGN_TOKENS.colors.destructive,
  },
  success: {
    backgroundColor: DESIGN_TOKENS.colors.primarySoft,
    borderColor: `${DESIGN_TOKENS.colors.primary}66`,
    color: DESIGN_TOKENS.colors.primary,
  },
  info: {
    backgroundColor: `${DESIGN_TOKENS.colors.muted}1F`,
    borderColor: `${DESIGN_TOKENS.colors.muted}66`,
    color: DESIGN_TOKENS.colors.muted,
  },
} as const;

export const ChatInlineBanner = ({ text, tone = 'info' }: ChatInlineBannerProps) => {
  const toneStyle = TONE_CLASSES[tone];

  return (
    <View style={[styles.container, { backgroundColor: toneStyle.backgroundColor, borderColor: toneStyle.borderColor }]}>
      <AppText variant="caption" style={[styles.text, { color: toneStyle.color }]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  text: {
    fontWeight: 'bold',
  },
});
