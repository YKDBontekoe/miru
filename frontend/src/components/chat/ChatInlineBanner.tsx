import React from 'react';
import { View, StyleSheet } from 'react-native';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

const TONE_COLORS = {
  error: DESIGN_TOKENS.colors.destructive,
  success: DESIGN_TOKENS.colors.primary,
  info: DESIGN_TOKENS.colors.muted,
};

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const color = TONE_COLORS[tone];

  return (
    <View
      style={[
        styles.container,
        {
          borderColor: `${color}66`,
          backgroundColor: `${color}1F`
        }
      ]}
    >
      <AppText variant="caption" style={[styles.text, { color }]}>
        {text}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 12,
    marginBottom: 8,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  text: {
    fontWeight: 'bold',
  },
});
