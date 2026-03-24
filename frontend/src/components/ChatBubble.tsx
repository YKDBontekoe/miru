import React from 'react';
import { View, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
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

function getAgentColor(name: string) {
  const palette = [
    theme.colors.primary.light,
    theme.colors.status.success,
    '#EC4899',
    '#8B5CF6',
    theme.colors.status.warning,
    '#10B981',
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function formatTime(iso?: string, language: string = 'en') {
  if (!iso) return '';
  const d = new Date(iso);
  return new Intl.DateTimeFormat(language, { hour: '2-digit', minute: '2-digit' }).format(d);
}

export function ChatBubble({
  text,
  isUser,
  status = MessageStatus.sent,
  agentName,
  timestamp,
  onRetry,
}: ChatBubbleProps) {
  const { t, i18n } = useTranslation();
  const isFailed = status === MessageStatus.error;
  const isStreaming = status === MessageStatus.streaming;
  const accentColor = agentName ? getAgentColor(agentName) : theme.colors.primary.DEFAULT;
  const retryScale = useSharedValue(1);

  const retryAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: retryScale.value }],
  }));

  const handleRetryPressIn = () => {
    retryScale.value = withSpring(0.95, { damping: 15, stiffness: 300 });
  };

  const handleRetryPressOut = () => {
    retryScale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  if (isUser) {
    return (
      <View style={styles.userContainer}>
        <View style={styles.userBubble}>
          <AppText style={styles.userText}>{text}</AppText>
        </View>
        {timestamp && (
          <AppText style={styles.timestampRight}>
            {formatTime(timestamp, i18n.language)}
          </AppText>
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
            {
              backgroundColor: isFailed ? theme.colors.status.errorSurfaceLight : `${accentColor}18`,
              borderColor: isFailed ? theme.colors.status.errorSurfaceDark : `${accentColor}35`,
            },
          ]}
        >
          <AppText
            style={{
              color: isFailed ? theme.colors.status.error : accentColor,
              fontSize: theme.typography.caption.fontSize - 2,
              fontWeight: '700',
            }}
          >
            {agentName ? agentName[0].toUpperCase() : 'A'}
          </AppText>
        </View>

        <View style={styles.agentContentWrapper}>
          {agentName && (
            <AppText
              style={{
                color: accentColor,
                fontSize: theme.typography.caption.fontSize,
                fontWeight: '600',
                marginBottom: theme.spacing.xxs,
              }}
            >
              {agentName}
            </AppText>
          )}

          <View
            style={[
              styles.agentBubble,
              {
                backgroundColor: isFailed ? theme.colors.status.errorSurfaceLight : theme.colors.surface.highLight,
                borderColor: isFailed ? theme.colors.status.errorSurfaceDark : theme.colors.surface.highestLight,
              },
            ]}
          >
            {text === '' && isStreaming ? (
              <TypingIndicator dotColor={accentColor} />
            ) : (
              <Markdown
                style={{
                  body: {
                    color: isFailed ? theme.colors.status.error : theme.colors.onSurface.light,
                    fontSize: theme.typography.body.fontSize,
                    margin: theme.spacing.none,
                    lineHeight: theme.typography.body.lineHeight,
                  },
                  paragraph: { marginTop: theme.spacing.none, marginBottom: theme.spacing.none },
                  code_inline: {
                    backgroundColor: theme.colors.surface.highestLight,
                    borderRadius: theme.borderRadius.xs,
                    paddingHorizontal: theme.spacing.xs,
                    color: theme.colors.onSurface.light,
                    fontSize: theme.typography.bodySm.fontSize,
                  },
                  fence: {
                    backgroundColor: theme.colors.surface.highLight,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.md,
                    marginVertical: theme.spacing.xs,
                  },
                  code_block: {
                    backgroundColor: theme.colors.surface.highLight,
                    borderRadius: theme.borderRadius.sm,
                    padding: theme.spacing.md,
                    color: theme.colors.onSurface.light,
                    fontSize: theme.typography.bodySm.fontSize - 1,
                  },
                  strong: { fontWeight: '700' },
                  em: { fontStyle: 'italic' },
                }}
              >
                {text}
              </Markdown>
            )}
          </View>

          {/* Error / retry row */}
          {isFailed && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color={theme.colors.status.error} />
              <AppText style={styles.errorText}>
                {t('chat.failed_to_send')}
              </AppText>
              {onRetry && (
                <Animated.View style={retryAnimatedStyle}>
                  <Pressable
                    onPress={onRetry}
                    onPressIn={handleRetryPressIn}
                    onPressOut={handleRetryPressOut}
                    style={styles.retryButton}
                  >
                    <Ionicons name="refresh-outline" size={13} color={theme.colors.primary.DEFAULT} />
                    <AppText style={styles.retryText}>
                      {t('chat.retry')}
                    </AppText>
                  </Pressable>
                </Animated.View>
              )}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText style={styles.timestampLeft}>
          {formatTime(timestamp, i18n.language)}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  userContainer: {
    alignItems: 'flex-end',
    marginBottom: theme.spacing.md,
    marginStart: 56,
  },
  userBubble: {
    backgroundColor: theme.colors.primary.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomRightRadius: theme.borderRadius.xs,
    maxWidth: '100%',
  },
  userText: {
    color: theme.colors.surface.light,
    fontSize: theme.typography.body.fontSize,
    lineHeight: theme.typography.body.lineHeight,
  },
  timestampRight: {
    color: theme.colors.onSurface.disabledLight,
    fontSize: theme.typography.caption.fontSize - 2,
    marginTop: 3,
    marginEnd: 2,
  },
  agentContainer: {
    alignItems: 'flex-start',
    marginBottom: theme.spacing.md,
    marginEnd: 56,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.sm,
    marginBottom: 2,
    flexShrink: 0,
  },
  agentContentWrapper: {
    flex: 1,
  },
  agentBubble: {
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderBottomLeftRadius: theme.borderRadius.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: theme.spacing.xs,
    gap: theme.spacing.sm,
  },
  errorText: {
    color: theme.colors.status.error,
    fontSize: theme.typography.caption.fontSize,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  retryText: {
    color: theme.colors.primary.DEFAULT,
    fontSize: theme.typography.caption.fontSize,
    fontWeight: '600',
  },
  timestampLeft: {
    color: theme.colors.onSurface.disabledLight,
    fontSize: theme.typography.caption.fontSize - 2,
    marginTop: 3,
    marginStart: 36,
  },
});
