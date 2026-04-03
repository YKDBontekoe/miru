import React from 'react';
import { View, StyleSheet } from 'react-native';
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
    <View style={styles.container}>
      <View
        style={[
          styles.bubble,
          { backgroundColor: theme.colors.primary.DEFAULT },
        ]}
      >
        <AppText style={styles.text}>{text}</AppText>
      </View>
      {timestamp && (
        <AppText
          style={[
            styles.timestamp,
            {
              color: isDark
                ? theme.colors.onSurface.disabledDark
                : theme.colors.onSurface.disabledLight,
            },
          ]}
        >
          {formatTime(timestamp, i18n.language)}
        </AppText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.lg,
    marginStart: theme.spacing.bubbleIndent,
  },
  bubble: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    maxWidth: '100%',
    borderRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.sm,
  },
  text: {
    ...theme.typography.body,
    color: theme.colors.white,
  },
  timestamp: {
    ...theme.typography.caption,
    marginTop: theme.spacing.xs,
    marginEnd: theme.spacing.xs,
  },
});
