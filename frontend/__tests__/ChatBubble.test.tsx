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
  it('renders user bubble correctly', () => {
    const { getByText } = render(<ChatBubble text="Hello AI" isUser={true} />);
    expect(getByText('Hello AI')).toBeTruthy();
  });

  it('renders agent bubble correctly', () => {
    const { getByText } = render(
      <ChatBubble text="Hello Human" isUser={false} agentName="Assistant" />
    );
    expect(getByText('Hello Human')).toBeTruthy();
    expect(getByText('A')).toBeTruthy(); // Initial
    expect(getByText('Assistant')).toBeTruthy();
  });

  it('renders error state and retry button', () => {
    const mockRetry = jest.fn();
    const { getByText } = render(
      <ChatBubble
        text="Failed message"
        isUser={false}
        status={MessageStatus.error}
        onRetry={mockRetry}
      />
    );
    expect(getByText('Failed message')).toBeTruthy();
    expect(getByText('chat.failed_to_send')).toBeTruthy();

    const retryBtn = getByText('chat.retry');
    fireEvent.press(retryBtn);
    expect(mockRetry).toHaveBeenCalledTimes(1);
  });

  it('renders typing indicator when streaming empty text', () => {
    const { queryByText } = render(
      <ChatBubble text="" isUser={false} status={MessageStatus.streaming} agentName="Assistant" />
    );
    expect(queryByText('Hello')).toBeNull();
  });
});
