import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import Markdown from 'react-native-markdown-display';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from './AppText';
import { TypingIndicator } from './TypingIndicator';
import { MessageStatus } from '../core/models';

const C = {
  userBubble: '#2563EB',
  userText: '#FFFFFF',
  agentBubble: '#F0F0F6',
  agentBubbleBorder: '#E0E0EC',
  agentText: '#12121A',
  errorBubble: '#FEF2F2',
  errorBubbleBorder: '#FECACA',
  errorText: '#DC2626',
  muted: '#6E6E80',
  faint: '#B0B0C0',
};

/**
 * Props for the ChatBubble component.
 *
 * @property {string} text - The message content. Markdown is supported for agent messages.
 * @property {boolean} isUser - True if the message was sent by the user, false if sent by an agent.
 * @property {MessageStatus} [status=MessageStatus.sent] - The delivery status of the message.
 * @property {string} [agentName] - The name of the agent (if isUser is false).
 * @property {string} [timestamp] - ISO 8601 timestamp of when the message was sent.
 * @property {() => void} [onRetry] - Callback invoked when the user presses retry on a failed message.
 */
interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  status?: MessageStatus;
  agentName?: string;
  timestamp?: string;
  onRetry?: () => void;
}

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

/**
 * Renders a single chat message bubble.
 * Differentiates visually between user and agent messages, supports markdown for agents,
 * and handles streaming, error, and retry states.
 */
export function ChatBubble({
  text,
  isUser,
  status = MessageStatus.sent,
  agentName,
  timestamp,
  onRetry,
}: ChatBubbleProps) {
  const { i18n } = useTranslation();
  const isFailed = status === MessageStatus.error;
  const isStreaming = status === MessageStatus.streaming;
  const accentColor = agentName ? getAgentColor(agentName) : '#2563EB';

  if (isUser) {
    return (
      <View style={{ alignItems: 'flex-end', marginBottom: 12, marginStart: 56 }}>
        <View
          style={{
            backgroundColor: C.userBubble,
            paddingHorizontal: 14,
            paddingVertical: 10,
            borderRadius: 18,
            borderBottomRightRadius: 4,
            maxWidth: '100%',
          }}
        >
          <AppText style={{ color: C.userText, fontSize: 16, lineHeight: 22 }}>{text}</AppText>
        </View>
        {timestamp && (
          <AppText style={{ color: C.faint, fontSize: 10, marginTop: 3, marginEnd: 2 }}>
            {formatTime(timestamp, i18n.language)}
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View style={{ alignItems: 'flex-start', marginBottom: 12, marginEnd: 56 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
        {/* Avatar */}
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: isFailed ? C.errorBubble : `${accentColor}18`,
            borderWidth: 1,
            borderColor: isFailed ? C.errorBubbleBorder : `${accentColor}35`,
            alignItems: 'center',
            justifyContent: 'center',
            marginEnd: 8,
            marginBottom: 2,
            flexShrink: 0,
          }}
        >
          <AppText
            style={{ color: isFailed ? C.errorText : accentColor, fontSize: 10, fontWeight: '700' }}
          >
            {agentName ? agentName[0].toUpperCase() : 'A'}
          </AppText>
        </View>

        <View style={{ flex: 1 }}>
          {agentName && (
            <AppText
              style={{ color: accentColor, fontSize: 12, fontWeight: '600', marginBottom: 3 }}
            >
              {agentName}
            </AppText>
          )}

          <View
            style={{
              backgroundColor: isFailed ? C.errorBubble : C.agentBubble,
              borderWidth: 1,
              borderColor: isFailed ? C.errorBubbleBorder : C.agentBubbleBorder,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderRadius: 18,
              borderBottomLeftRadius: 4,
            }}
          >
            {text === '' && isStreaming ? (
              <TypingIndicator dotColor={accentColor} />
            ) : (
              <Markdown
                style={{
                  body: { color: isFailed ? C.errorText : C.agentText, fontSize: 16, margin: 0 },
                  paragraph: { marginTop: 0, marginBottom: 0 },
                  code_inline: {
                    backgroundColor: '#E8E8F0',
                    borderRadius: 4,
                    paddingHorizontal: 4,
                    color: '#12121A',
                    fontSize: 14,
                  },
                  fence: {
                    backgroundColor: '#F0F0F6',
                    borderRadius: 8,
                    padding: 12,
                    marginVertical: 4,
                  },
                  code_block: {
                    backgroundColor: '#F0F0F6',
                    borderRadius: 8,
                    padding: 12,
                    color: '#12121A',
                    fontSize: 13,
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
            <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 4, gap: 8 }}>
              <Ionicons name="alert-circle-outline" size={13} color={C.errorText} />
              <AppText style={{ color: C.errorText, fontSize: 12 }}>Failed to send</AppText>
              {onRetry && (
                <TouchableOpacity
                  onPress={onRetry}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}
                >
                  <Ionicons name="refresh-outline" size={13} color={C.userBubble} />
                  <AppText style={{ color: C.userBubble, fontSize: 12, fontWeight: '600' }}>
                    Retry
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText style={{ color: C.faint, fontSize: 10, marginTop: 3, marginStart: 36 }}>
          {formatTime(timestamp, i18n.language)}
        </AppText>
      )}
    </View>
  );
}
