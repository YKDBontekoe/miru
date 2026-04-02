import React from 'react';
import { MessageStatus } from '../core/models';
import { UserChatBubble } from './chat/UserChatBubble';
import { AgentChatBubble } from './chat/AgentChatBubble';

interface ChatBubbleProps {
  text: string;
  isUser: boolean;
  status?: MessageStatus;
  agentName?: string;
  timestamp?: string;
  onRetry?: () => void;
}

/**
 * Renders a chat message bubble for either the user or an agent.
 *
 * Supports Markdown rendering for agent messages, displaying avatars,
 * timestamps, error states, and a typing indicator if the message is streaming.
 *
 * @param props.text - The message content (supports Markdown if isUser is false).
 * @param props.isUser - If true, renders as a user message (right-aligned, primary color).
 * @param props.status - The delivery status of the message (sent, error, streaming).
 * @param props.agentName - The name of the agent (used to generate an avatar and accent color).
 * @param props.timestamp - The ISO string representing when the message was sent.
 * @param props.onRetry - Callback invoked when the user taps the retry button on a failed message.
 */
export function ChatBubble({
  text,
  isUser,
  status = MessageStatus.sent,
  agentName,
  timestamp,
  onRetry,
}: ChatBubbleProps) {
  if (isUser) {
    return <UserChatBubble text={text} timestamp={timestamp} />;
  }

  return (
    <AgentChatBubble
      text={text}
      status={status}
      agentName={agentName}
      timestamp={timestamp}
      onRetry={onRetry}
    />
  );
}
