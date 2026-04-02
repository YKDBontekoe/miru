import React from 'react';
import { View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { AppText } from '@/components/AppText';
import { formatTime } from '@/utils/chatUtils';
import { theme } from '@/core/theme';

interface UserChatBubbleProps {
  text: string;
  timestamp?: string;
}

export const UserChatBubble = ({ text, timestamp }: UserChatBubbleProps) => {
  const { i18n } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View className="items-end mb-4 ms-[52px]">
      <View className="px-4 py-3 max-w-full border border-transparent rounded-2xl rounded-br-sm bg-primary">
        <AppText className="text-white text-[15px] leading-6">{text}</AppText>
      </View>
      {timestamp && (
        <AppText
          className="text-[10px] mt-1 me-1"
          style={{
            color: isDark
              ? theme.colors.onSurface.disabledDark
              : theme.colors.onSurface.disabledLight,
          }}
        >
          {formatTime(timestamp, i18n.language)}
        </AppText>
      )}
    </View>
  );
};
