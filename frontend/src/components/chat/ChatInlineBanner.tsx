import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';
import { DESIGN_TOKENS } from '@/core/design/tokens';

const C = {
  primary: DESIGN_TOKENS.colors.primary,
  muted: DESIGN_TOKENS.colors.muted,
  destructive: DESIGN_TOKENS.colors.destructive,
};

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

const TONE_CLASSES = {
  error: {
    box: { borderColor: `${C.destructive}66`, backgroundColor: `${C.destructive}1F` },
    text: { color: C.destructive },
  },
  success: {
    box: { borderColor: `${C.primary}66`, backgroundColor: `${C.primary}1F` },
    text: { color: C.primary },
  },
  info: {
    box: { borderColor: `${C.muted}66`, backgroundColor: `${C.muted}1F` },
    text: { color: C.muted },
  },
} as const;

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const toneClass = TONE_CLASSES[tone];
  return (
    <View className="mx-3 mb-2 rounded-xl border px-2.5 py-2" style={toneClass.box}>
      <AppText variant="caption" className="font-bold" style={toneClass.text}>
        {text}
      </AppText>
    </View>
  );
}
