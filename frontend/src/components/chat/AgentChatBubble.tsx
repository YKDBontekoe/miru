import React, { useMemo } from 'react';
import { View } from 'react-native';
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
    <View className="items-start mb-4 me-[52px]">
      <View className="flex-row items-end">
        {/* Avatar */}
        <View
          className="w-7 h-7 rounded-full border items-center justify-center me-3 mb-1 shrink-0"
          style={
            isFailed
              ? {
                  backgroundColor: errorBubbleStyle.backgroundColor,
                  borderColor: errorBubbleStyle.borderColor,
                }
              : { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }
          }
        >
          <AppText
            className="text-[10px] font-bold"
            style={isFailed ? { color: theme.colors.status.error } : { color: accentColor }}
          >
            {agentName ? agentName[0].toUpperCase() : 'A'}
          </AppText>
        </View>

        <View className="flex-1">
          {agentName && (
            <AppText className="text-xs font-semibold mb-2" style={{ color: accentColor }}>
              {agentName}
            </AppText>
          )}

          <View
            className="px-4 py-3 max-w-full border border-transparent rounded-2xl rounded-bl-sm"
            style={isFailed ? errorBubbleStyle : agentBubbleStyle}
          >
            {text === '' && isStreaming ? (
              <TypingIndicator dotColor={accentColor} />
            ) : (
              <Markdown style={markdownStyles}>{text}</Markdown>
            )}
          </View>

          {/* Error / retry row */}
          {isFailed && (
            <View className="flex-row items-center mt-2 gap-2">
              <Ionicons name="alert-circle-outline" size={13} color={theme.colors.status.error} />
              <AppText className="text-status-error text-xs">{t('chat.failed_to_send')}</AppText>
              {onRetry && <ChatBubbleRetryButton onRetry={onRetry} />}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText
          className="text-[10px] mt-2 ms-[40px]"
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
