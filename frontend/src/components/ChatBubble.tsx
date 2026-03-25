import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { AppText } from './AppText';
import { TypingIndicator } from './TypingIndicator';
import { MessageStatus } from '../core/models';
import { theme } from '../core/theme';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  status?: MessageStatus;
  agentName?: string;
  timestamp?: string;
  onRetry?: () => void;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function formatTime(iso?: string, language: string = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(d);
}

// DOCS(miru-agent): needs documentation
export function ChatBubble({
  text,
  isUser,
  status = MessageStatus.sent,
  agentName,
  timestamp,
  onRetry,
}: ChatBubbleProps) {
  const { t, i18n } = useTranslation();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const isFailed = status === MessageStatus.error;
  const isStreaming = status === MessageStatus.streaming;
  const accentColor = agentName ? getAgentColor(agentName) : theme.colors.primary.DEFAULT;

  const retryScale = useSharedValue(1);

  const handleRetryPressIn = () => {
    retryScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleRetryPressOut = () => {
    retryScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  const userBubbleStyle = {
    backgroundColor: theme.colors.primary.DEFAULT,
  };

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

  const userTextStyle = {
    color: theme.colors.white,
  };

  const agentTextStyle = {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
  };

  const markdownStyles = {
    body: {
      color: isFailed ? theme.colors.status.error : agentTextStyle.color,
      ...theme.typography.body,
      margin: 0,
    },
    paragraph: { marginTop: 0, marginBottom: 0 },
    code_inline: {
      backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highestLight,
      borderRadius: theme.borderRadius.xs,
      paddingHorizontal: theme.spacing.xs,
      color: agentTextStyle.color,
      ...theme.typography.bodySm,
    },
    fence: {
      backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.highLight,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
      marginVertical: theme.spacing.xs,
    },
    code_block: {
      backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.highLight,
      borderRadius: theme.borderRadius.sm,
      padding: theme.spacing.md,
      color: agentTextStyle.color,
      ...theme.typography.bodySm,
    },
    strong: { fontWeight: '700' as const },
    em: { fontStyle: 'italic' as const },
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={[styles.bubbleBase, styles.userBubbleShape, userBubbleStyle]}>
          <AppText style={[styles.messageText, userTextStyle]}>{text}</AppText>
        </View>
        {timestamp && (
          <AppText style={styles.timestampRight}>{formatTime(timestamp, i18n.language)}</AppText>
        )}
      </View>
    );
  }

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
              {onRetry && (
                <AnimatedPressable
                  onPress={onRetry}
                  onPressIn={handleRetryPressIn}
                  onPressOut={handleRetryPressOut}
                  style={[styles.retryButton, retryAnimatedStyle]}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="refresh-outline" size={13} color={theme.colors.primary.DEFAULT} />
                  <AppText style={styles.retryText}>{t('chat.retry')}</AppText>
                </AnimatedPressable>
              )}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText style={styles.timestampLeft}>{formatTime(timestamp, i18n.language)}</AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    marginStart: theme.spacing.bubbleIndent,
  },
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
  userBubbleShape: {
    borderRadius: theme.borderRadius.xl,
    borderBottomRightRadius: theme.borderRadius.xs,
  },
  agentBubbleShape: {
    borderRadius: theme.borderRadius.xl,
    borderBottomLeftRadius: theme.borderRadius.xs,
  },
  messageText: {
    ...theme.typography.body,
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
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.xs,
  },
  retryText: {
    color: theme.colors.primary.DEFAULT,
    fontSize: 12,
    fontWeight: '600',
  },
  timestampRight: {
    color: theme.colors.onSurface.disabledLight,
    fontSize: 10,
    marginTop: theme.spacing.xs,
    marginEnd: theme.spacing.xxs,
  },
  timestampLeft: {
    color: theme.colors.onSurface.disabledLight,
    fontSize: 10,
    marginTop: theme.spacing.xs,
    marginStart: theme.spacing.bubbleTimestampIndent,
  },
});
