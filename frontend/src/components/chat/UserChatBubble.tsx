import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { formatTime } from '../../utils/chatUtils';
import { theme } from '../../core/theme';

interface UserChatBubbleProps {
  text: string;
  timestamp?: string;
}

export const UserChatBubble = ({ text, timestamp }: UserChatBubbleProps) => {
  const { i18n } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={styles.userContainer}>
      <View style={[styles.bubbleBase, styles.userBubbleShape, styles.userBubbleStyle]}>
        <AppText style={[styles.messageText, styles.userTextStyle]}>{text}</AppText>
      </View>
      {timestamp && (
        <AppText
          style={[
            styles.timestampRightBase,
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
  userContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    marginStart: theme.spacing.bubbleIndent,
  },
  bubbleBase: {
    paddingHorizontal: theme.spacing.bubblePaddingH,
    paddingVertical: theme.spacing.bubblePaddingV,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: theme.colors.transparent,
  },
  userBubbleShape: {
    borderRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  userBubbleStyle: {
    backgroundColor: theme.colors.primary.DEFAULT,
  },
  messageText: {
    ...theme.typography.body,
  },
  userTextStyle: {
    color: theme.colors.white,
  },
  timestampRightBase: {
    fontSize: 10,
    marginTop: theme.spacing.xs,
    marginEnd: theme.spacing.xxs,
  },
});
