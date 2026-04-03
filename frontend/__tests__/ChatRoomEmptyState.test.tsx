import React from 'react';
import { render } from '@testing-library/react-native';
import { ChatRoomEmptyState } from '../src/components/chat/ChatRoomEmptyState';

import { useColorScheme } from 'nativewind';

// Mock translation
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options: any) => {
      if (key === 'chat.room_agents_status') return `Status: ${options.names}`;
      return key;
    },
    i18n: { language: 'en' },
  }),
}));

// Mock NativeWind's useColorScheme to test dark and light modes
jest.mock('nativewind', () => ({
  useColorScheme: jest.fn().mockReturnValue({ colorScheme: 'light' }),
}));

describe('ChatRoomEmptyState', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with no agents', () => {
    const { getByText } = render(<ChatRoomEmptyState roomAgents={[]} />);
    expect(getByText('chat.start_conversation')).toBeTruthy();
    expect(getByText('chat.add_agent_to_start')).toBeTruthy();
  });

  it('renders correctly with agents present', () => {
    const mockAgents = [
      { id: '1', name: 'Alice', role: 'assistant', description: '' },
      { id: '2', name: 'Bob', role: 'assistant', description: '' },
    ];
    const { getByText } = render(<ChatRoomEmptyState roomAgents={mockAgents as any} />);
    expect(getByText('chat.start_conversation')).toBeTruthy();
    expect(getByText('Status: Alice, Bob')).toBeTruthy();
  });

  it('renders correctly in dark mode', () => {
    (useColorScheme as jest.Mock).mockReturnValue({ colorScheme: 'dark' });
    const { getByText } = render(<ChatRoomEmptyState roomAgents={[]} />);
    expect(getByText('chat.start_conversation')).toBeTruthy();
  });
});
