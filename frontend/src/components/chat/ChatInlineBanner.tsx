import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

const COLORS = {
  error: DESIGN_TOKENS.colors.destructive,
  success: DESIGN_TOKENS.colors.primary,
  info: DESIGN_TOKENS.colors.muted,
} as const;

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const color = COLORS[tone];
  return (
    <View
      style={{
        marginHorizontal: 12,
        marginBottom: 8,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: `${color}40`,
        backgroundColor: `${color}12`,
        paddingHorizontal: 10,
        paddingVertical: 8,
      }}
    >
      <AppText variant="caption" style={{ color, fontWeight: '700' }}>
        {text}
      </AppText>
    </View>
  );
}
