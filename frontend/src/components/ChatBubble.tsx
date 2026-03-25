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
 * A component to render individual chat messages in a conversation.
 *
 * @param props - Component props
 * @param props.text - The actual text content of the message.
 * @param props.isUser - Boolean indicating if the message was sent by the current user.
 * @param props.status - The delivery/processing status of the message.
 * @param props.agentName - Optional name of the agent if the message is from an AI.
 * @param props.timestamp - Optional timestamp string.
 * @param props.onRetry - Callback to retry sending a failed message.
 */
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
  const accentColor = agentName ? getAgentColor(agentName) : '#2563EB';

  if (isUser) {
    return (
      <View className="items-end mb-3 ms-14">
        <View className="bg-blue-600 px-3.5 py-2.5 rounded-2xl rounded-br-[4px] max-w-full">
          <AppText className="text-white text-base leading-[22px]">{text}</AppText>
        </View>
        {timestamp && (
          <AppText className="text-[#B0B0C0] text-[10px] mt-[3px] me-0.5">
            {formatTime(timestamp, i18n.language)}
          </AppText>
        )}
      </View>
    );
  }

  return (
    <View className="items-start mb-3 me-14">
      <View className="flex-row items-end">
        {/* Avatar */}
        <View
          className={`w-7 h-7 rounded-full border items-center justify-center me-2 mb-0.5 shrink-0 ${isFailed ? 'bg-red-50 border-red-200' : ''}`}
          style={
            !isFailed
              ? { backgroundColor: `${accentColor}18`, borderColor: `${accentColor}35` }
              : {}
          }
        >
          <AppText
            className={`text-[10px] font-bold ${isFailed ? 'text-red-600' : ''}`}
            style={!isFailed ? { color: accentColor } : {}}
          >
            {agentName ? agentName[0].toUpperCase() : 'A'}
          </AppText>
        </View>

        <View className="flex-1">
          {agentName && (
            <AppText className="text-xs font-semibold mb-[3px]" style={{ color: accentColor }}>
              {agentName}
            </AppText>
          )}

          <View
            className={`border px-3.5 py-2.5 rounded-2xl rounded-bl-[4px] ${isFailed ? 'bg-red-50 border-red-200' : 'bg-[#F0F0F6] border-[#E0E0EC]'}`}
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
            <View className="flex-row items-center mt-1 gap-2">
              <Ionicons name="alert-circle-outline" size={13} color={C.errorText} />
              <AppText className="text-red-600 text-xs">{t('chat.failed_to_send')}</AppText>
              {onRetry && (
                <TouchableOpacity onPress={onRetry} className="flex-row items-center gap-[3px]">
                  <Ionicons name="refresh-outline" size={13} color={C.userBubble} />
                  <AppText className="text-blue-600 text-xs font-semibold">
                    {t('chat.retry')}
                  </AppText>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>

      {timestamp && !isFailed && (
        <AppText className="text-[#B0B0C0] text-[10px] mt-[3px] ms-9">
          {formatTime(timestamp, i18n.language)}
        </AppText>
      )}
    </View>
  );
}
