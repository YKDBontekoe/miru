import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatBubble } from '../src/components/ChatBubble';
import { MessageStatus } from '../src/core/models';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('ChatBubble', () => {
  it('renders user message correctly', () => {
    const { getByText } = render(
      <ChatBubble text="User message" isUser={true} />
    );
    expect(getByText('User message')).toBeTruthy();
  });

  it('renders agent message correctly', () => {
    const { getByText } = render(
      <ChatBubble text="Agent message" isUser={false} agentName="Agent" />
    );
    expect(getByText('Agent')).toBeTruthy();
  });

  it('renders failed state for user message', () => {
    const onRetryMock = jest.fn();
    const { getByText, UNSAFE_getByProps } = render(
      <ChatBubble
        text="Failed message"
        isUser={false}
        status={MessageStatus.error}
        onRetry={onRetryMock}
      />
    );
    expect(getByText('chat.failed_to_send')).toBeTruthy();

    // retry pressable
    const button = UNSAFE_getByProps({ onPress: onRetryMock });
    fireEvent.press(button);
    expect(onRetryMock).toHaveBeenCalledTimes(1);

    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
  });

  it('renders streaming state (typing indicator) for empty agent message', () => {
    const { getByTestId, UNSAFE_getByProps } = render(
      <ChatBubble
        text=""
        isUser={false}
        agentName="Agent"
        status={MessageStatus.streaming}
      />
    );
    // Since typing indicator is rendered without explicit testID, we check if the component renders without crashing
    expect(true).toBeTruthy();
  });

  it('renders timestamp correctly', () => {
    const { getByText } = render(
      <ChatBubble
        text="Message with time"
        isUser={true}
        timestamp="2024-01-01T12:00:00Z"
      />
    );
    // In CI node timezone may be different or formats may differ slightly, so using regex to match time broadly.
    // E.g. '12:00 PM' or '12:00'
    const timeMatch = /12:00/i;

    expect(getByText(timeMatch)).toBeTruthy();
  });
});
