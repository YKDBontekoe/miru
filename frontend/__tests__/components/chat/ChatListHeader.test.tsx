import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatListHeader } from '../../../src/components/chat/ChatListHeader';

jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));

jest.mock('../../../src/components/chat/AgentPill', () => ({
  AgentPill: ({ agent, onPress }: any) => {
    const React = require('react');
    const { Pressable, Text } = require('react-native');
    return (
      <Pressable onPress={onPress}>
        <Text>AgentPill-{agent.name}</Text>
      </Pressable>
    );
  },
}));

const mockAgents = [
  { id: 'a1', name: 'Agent 1', status: 'idle' } as any,
  { id: 'a2', name: 'Agent 2', status: 'idle' } as any,
];

describe('ChatListHeader', () => {
  const defaultProps = {
    t: (key: string, _default?: any) => key,
    query: '',
    onChangeQuery: jest.fn(),
    sortMode: 'recent' as any,
    onChangeSortMode: jest.fn(),
    recentOnly: false,
    unreadOnly: false,
    onToggleRecentOnly: jest.fn(),
    onToggleUnreadOnly: jest.fn(),
    agents: mockAgents,
    selectedAgentId: null,
    onSelectAgent: jest.fn(),
    activeFilterCount: 0,
    roomCount: 10,
  };

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders correctly', () => {
    const { getAllByText, getByText, getByPlaceholderText, queryByText } = render(<ChatListHeader {...defaultProps} />);
    expect(getAllByText('chat.chats').length).toBeGreaterThan(0);
    expect(getByText('chat.personas')).toBeTruthy();
    expect(getByText('10')).toBeTruthy();
    expect(getByPlaceholderText('chat.search_placeholder')).toBeTruthy();
  });

  it('handles empty agents array', () => {
    const { queryByText } = render(<ChatListHeader {...defaultProps} agents={[]} />);
    expect(queryByText('chat.personas')).toBeNull();
  });

  it('renders active filter count appropriately', () => {
    const { getByText } = render(<ChatListHeader {...defaultProps} activeFilterCount={2} />);
    expect(getByText('chat.active_filters')).toBeTruthy();
  });

  it('handles query change', () => {
    const { getByPlaceholderText } = render(<ChatListHeader {...defaultProps} />);
    fireEvent.changeText(getByPlaceholderText('chat.search_placeholder'), 'hello');

    // Check that it calls onChangeQuery after a debounce
    jest.advanceTimersByTime(300);
    expect(defaultProps.onChangeQuery).toHaveBeenCalledWith('hello');
  });

  it('clears query when close button is pressed', () => {
    const { getByPlaceholderText, getByLabelText } = render(
      <ChatListHeader {...defaultProps} query="hello" />
    );
    fireEvent.press(getByLabelText('common.close'));
    expect(getByPlaceholderText('chat.search_placeholder').props.value).toBe('');
  });

  it('changes sort mode when sort buttons are pressed', () => {
    const { getByText } = render(<ChatListHeader {...defaultProps} />);
    fireEvent.press(getByText('chat.filter_mentions'));
    expect(defaultProps.onChangeSortMode).toHaveBeenCalledWith('mentions');
  });

  it('toggles recent and unread filters', () => {
    const { getByText } = render(<ChatListHeader {...defaultProps} />);
    fireEvent.press(getByText('chat.recent_only'));
    expect(defaultProps.onToggleRecentOnly).toHaveBeenCalled();

    fireEvent.press(getByText('chat.unread_only'));
    expect(defaultProps.onToggleUnreadOnly).toHaveBeenCalled();
  });

  it('selects and deselects agents', () => {
    const { getByText } = render(<ChatListHeader {...defaultProps} />);

    // Select agent 1
    fireEvent.press(getByText('AgentPill-Agent 1'));
    expect(defaultProps.onSelectAgent).toHaveBeenCalledWith('a1');

    // Deselect via "All" button
    fireEvent.press(getByText('chat.all_agents'));
    expect(defaultProps.onSelectAgent).toHaveBeenCalledWith(null);
  });

  it('selects same agent to toggle off', () => {
    const { getByText } = render(<ChatListHeader {...defaultProps} selectedAgentId="a1" />);
    // Select agent 1 again (should deselect)
    fireEvent.press(getByText('AgentPill-Agent 1'));
    expect(defaultProps.onSelectAgent).toHaveBeenCalledWith(null);
  });
});
