import React from 'react';
import { View } from 'react-native';
import { AppText } from '@/components/AppText';

interface ChatInlineBannerProps {
  text: string;
  tone?: 'error' | 'success' | 'info';
}

const TONE_CLASSES = {
  error: {
    box: 'border-[#B23A3A66] bg-[#B23A3A1F]',
    text: 'text-[#B23A3A]',
  },
  success: {
    box: 'border-[#147D6466] bg-[#147D641F]',
    text: 'text-[#147D64]',
  },
  info: {
    box: 'border-[#5A746766] bg-[#5A74671F]',
    text: 'text-[#5A7467]',
  },
} as const;

export function ChatInlineBanner({ text, tone = 'info' }: ChatInlineBannerProps) {
  const toneClass = TONE_CLASSES[tone];
  return (
    <View className={`mx-3 mb-2 rounded-xl border px-2.5 py-2 ${toneClass.box}`}>
      <AppText variant="caption" className={`font-bold ${toneClass.text}`}>
        {text}
      </AppText>
    </View>
  );
}
