import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import { ChatListHeader } from '../../../src/components/chat/ChatListHeader';
import { Agent } from '../../../src/core/models';

const mockAgents = [
  {
    id: 'a1',
    name: 'Agent 1',
    description: '',
    created_at: '',
    updated_at: '',
    personality: '',
    goals: '',
    capabilities: [] as any,
    integrations: [] as any,
    avatar_url: '',
    is_active: true,
    system_prompt: '',
    created_by: 'system',
    status: 'idle',
    mood: 'neutral',
    message_count: 0,
    integration_configs: {},
  } as unknown as Agent,
  {
    id: 'a2',
    name: 'Agent 2',
    description: '',
    created_at: '',
    updated_at: '',
    personality: '',
    goals: '',
    capabilities: [] as any,
    integrations: [] as any,
    avatar_url: '',
    is_active: true,
    system_prompt: '',
    created_by: 'system',
    status: 'idle',
    mood: 'neutral',
    message_count: 0,
    integration_configs: {},
  } as unknown as Agent,
];

describe('ChatListHeader', () => {
  const defaultProps = {
    t: (key: string, _opts?: any) => key,
    query: '',
    onChangeQuery: jest.fn(),
    sortMode: 'recent' as const,
    onChangeSortMode: jest.fn(),
    recentOnly: false,
    unreadOnly: false,
    onToggleRecentOnly: jest.fn(),
    onToggleUnreadOnly: jest.fn(),
    agents: mockAgents,
    selectedAgentId: null,
    onSelectAgent: jest.fn(),
    activeFilterCount: 0,
    roomCount: 5,
  };

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(<ChatListHeader {...defaultProps} />);
    expect(getByText('chat.title')).toBeTruthy();
    expect(getByPlaceholderText('chat.search_placeholder')).toBeTruthy();
    expect(getByText('chat.filter_recent')).toBeTruthy();
    expect(getByText('chat.personas')).toBeTruthy();
    expect(getByText('5')).toBeTruthy();
  });

  it('handles search input', () => {
    jest.useFakeTimers();
    const onChangeQueryMock = jest.fn();
    const { getByPlaceholderText } = render(
      <ChatListHeader {...defaultProps} onChangeQuery={onChangeQueryMock} />
    );

    const input = getByPlaceholderText('chat.search_placeholder');
    fireEvent.changeText(input, 'test query');

    act(() => {
      jest.runAllTimers();
    });

    expect(onChangeQueryMock).toHaveBeenCalledWith('test query');
    jest.useRealTimers();
  });

  it('clears search input when close button is pressed', () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <ChatListHeader {...defaultProps} query="initial query" />
    );

    const closeButton = getByLabelText('common.close');
    fireEvent.press(closeButton);

    const input = getByPlaceholderText('chat.search_placeholder');
    expect(input.props.value).toBe('');
  });

  it('calls onChangeSortMode when a sort pill is pressed', () => {
    const onChangeSortModeMock = jest.fn();
    const { getByText } = render(
      <ChatListHeader {...defaultProps} onChangeSortMode={onChangeSortModeMock} />
    );

    fireEvent.press(getByText('chat.filter_mentions'));
    expect(onChangeSortModeMock).toHaveBeenCalledWith('mentions');
  });

  it('calls onToggleRecentOnly and onToggleUnreadOnly', () => {
    const onToggleRecentOnlyMock = jest.fn();
    const onToggleUnreadOnlyMock = jest.fn();
    const { getByText } = render(
      <ChatListHeader
        {...defaultProps}
        onToggleRecentOnly={onToggleRecentOnlyMock}
        onToggleUnreadOnly={onToggleUnreadOnlyMock}
      />
    );

    fireEvent.press(getByText('chat.recent_only'));
    expect(onToggleRecentOnlyMock).toHaveBeenCalled();

    fireEvent.press(getByText('chat.unread_only'));
    expect(onToggleUnreadOnlyMock).toHaveBeenCalled();
  });

  it('calls onSelectAgent when an agent pill is pressed', () => {
    const onSelectAgentMock = jest.fn();
    const { getByText } = render(
      <ChatListHeader {...defaultProps} onSelectAgent={onSelectAgentMock} />
    );

    // Assuming AgentPill renders the agent's name
    fireEvent.press(getByText('Agent 1'));
    expect(onSelectAgentMock).toHaveBeenCalledWith('a1');
  });

  it('calls onSelectAgent with null when "All" is pressed', () => {
    const onSelectAgentMock = jest.fn();
    const { getByText } = render(
      <ChatListHeader {...defaultProps} selectedAgentId="a1" onSelectAgent={onSelectAgentMock} />
    );

    fireEvent.press(getByText('chat.all_agents'));
    expect(onSelectAgentMock).toHaveBeenCalledWith(null);
  });
});
