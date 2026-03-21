import React from 'react';
import { View, TouchableOpacity, useColorScheme } from 'react-native';
import Markdown from 'react-native-markdown-display';
import { AppText } from './AppText';
import { TypingIndicator } from './TypingIndicator';
import { MessageStatus } from '../core/models';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  status?: MessageStatus;
  agentName?: string;
  onCopy?: () => void;
  onRetry?: () => void;
}

export function ChatBubble({
  text,
  isUser,
  status = MessageStatus.sent,
  agentName,
  onCopy,
  onRetry,
}: ChatBubbleProps) {
  const isDark = useColorScheme() === 'dark';

  if (isUser) {
    return (
      <View className="items-end mb-sm ml-xxxl">
        <View className="bg-primary px-lg py-md rounded-t-xl rounded-bl-xl rounded-br-xs shadow-md">
          <AppText className="text-white">{text}</AppText>
        </View>
      </View>
    );
  }

  const isFailed = status === MessageStatus.error;
  const accentColor = agentName ? getAgentColor(agentName) : '#2563EB';

  return (
    <View className="items-start mb-sm mr-xxxl flex-row">
      {/* Avatar */}
      <View
        className="w-7 h-7 rounded-full items-center justify-center mr-sm mt-1"
        style={{
          backgroundColor: isFailed ? '#F8717120' : `${accentColor}20`,
          borderWidth: 1,
          borderColor: isFailed ? '#F8717140' : `${accentColor}40`,
        }}
      >
        <AppText
          className="text-[10px] font-bold"
          style={{ color: isFailed ? '#F87171' : accentColor }}
        >
          {agentName ? agentName[0].toUpperCase() : 'A'}
        </AppText>
      </View>

      <View className="flex-1">
        {agentName && (
          <AppText className="text-xs font-semibold mb-xxs" style={{ color: accentColor }}>
            {agentName}
          </AppText>
        )}

        <TouchableOpacity
          onLongPress={onCopy}
          activeOpacity={0.9}
          className="bg-surface-highLight dark:bg-surface-highDark px-lg py-md rounded-t-sm rounded-r-xl rounded-b-xl border border-border-light dark:border-border-dark"
          style={isFailed ? { backgroundColor: '#F8717110', borderColor: '#F8717140' } : {}}
        >
          {text === '' && status === MessageStatus.streaming ? (
            <TypingIndicator dotColor={accentColor} />
          ) : (
            <Markdown
              style={{
                body: {
                  color: isFailed ? '#F87171' : isDark ? '#F0EFF4' : '#12121A',
                  fontSize: 16,
                },
                paragraph: {
                  marginTop: 0,
                  marginBottom: 0,
                },
              }}
            >
              {text}
            </Markdown>
          )}
        </TouchableOpacity>

        {isFailed && onRetry && (
          <TouchableOpacity onPress={onRetry} className="mt-xs flex-row items-center">
            <AppText className="text-status-error text-xs font-medium">Retry</AppText>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function getAgentColor(name: string) {
  const palette = [
    '#3B82F6', // blue
    '#14B8A6', // teal
    '#EC4899', // pink
    '#8B5CF6', // violet
    '#F59E0B', // amber
    '#10B981', // emerald
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
