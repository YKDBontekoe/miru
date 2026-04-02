import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { TypingIndicator } from '../TypingIndicator';
import { ChatBubbleRetryButton } from './ChatBubbleRetryButton';
import { MessageStatus } from '../../core/models';
import { getAgentColor, formatTime } from '../../utils/chatUtils';
import { getMarkdownStyles } from './markdownStyles';
import { theme } from '../../core/theme';

interface AgentChatBubbleProps {
  text: string;
  status?: MessageStatus;
  agentName?: string;
  timestamp?: string;
  onRetry?: () => void;
}

export const AgentChatBubble = ({
  text,
  status = MessageStatus.sent,
  agentName,
  timestamp,
  onRetry,
}: AgentChatBubbleProps) => {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isFailed = status === MessageStatus.error;
  const isStreaming = status === MessageStatus.streaming;
  const accentColor = agentName ? getAgentColor(agentName) : theme.colors.primary.DEFAULT;

  const agentBubbleStyle = {
    backgroundColor: isDark ? theme.colors.surface.highestDark : theme.colors.surface.highLight,
    borderColor: isDark ? theme.colors.border.dark : theme.colors.border.light,
  };

  const errorBubbleStyle = {
    backgroundColor: isDark
      ? theme.colors.status.errorSurfaceDark
      : theme.colors.status.errorSurfaceLight,
    borderColor: theme.colors.status.error,
  };

  const agentTextStyle = {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
  };

  const markdownStyles = useMemo(
    () => getMarkdownStyles(isDark, isFailed, agentTextStyle.color),
    [isDark, isFailed, agentTextStyle.color]
  );

  return (
    <View style={styles.agentContainer}>
      <View style={styles.agentRow}>
        {/* Avatar */}
        <View
          style={[
            styles.avatar,
            isFailed
              ? {
                  backgroundColor: errorBubbleStyle.backgroundColor,
                  borderColor: errorBubbleStyle.borderColor,
                }
              : { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` },
          ]}
        >
          <AppText
            style={[
              styles.avatarText,
              isFailed ? { color: theme.colors.status.error } : { color: accentColor },
            ]}
          >
            {agentName ? agentName[0].toUpperCase() : 'A'}
          </AppText>
        </View>

        <View style={styles.bubbleContentWrapper}>
          {agentName && (
            <AppText style={[styles.agentName, { color: accentColor }]}>{agentName}</AppText>
          )}

          <View
            style={[
              styles.bubbleBase,
              styles.agentBubbleShape,
              isFailed ? errorBubbleStyle : agentBubbleStyle,
            ]}
          >
            {text === '' && isStreaming ? (
              <TypingIndicator dotColor={accentColor} />
            ) : (
              <Markdown style={markdownStyles}>{text}</Markdown>
            )}
          </View>

          {/* Error / retry row */}
          {isFailed && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color={theme.colors.status.error} />
              <AppText style={styles.errorText}>{t('chat.failed_to_send')}</AppText>
              {onRetry && <ChatBubbleRetryButton onRetry={onRetry} />}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText
          style={[
            styles.timestampLeftBase,
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
  agentContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    marginEnd: theme.spacing.bubbleIndent,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  bubbleBase: {
    paddingHorizontal: theme.spacing.bubblePaddingH,
    paddingVertical: theme.spacing.bubblePaddingV,
    maxWidth: '100%',
    borderWidth: 1,
    borderColor: theme.colors.transparent,
  },
  agentBubbleShape: {
    borderRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: theme.borderRadius.xs,
  },
  avatar: {
    width: theme.spacing.avatar,
    height: theme.spacing.avatar,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.sm,
    marginBottom: theme.spacing.xxs,
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  bubbleContentWrapper: {
    flex: 1,
  },
  agentName: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: theme.spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: 12,
  },
  timestampLeftBase: {
    fontSize: 10,
    marginTop: theme.spacing.xs,
    marginStart: theme.spacing.bubbleTimestampIndent,
  },
});
