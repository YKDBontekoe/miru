import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoomCard } from '../../../src/components/chat/RoomCard';
import { ChatRoom } from '../../../src/core/models';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: any, params?: any) => {
      // In useTranslation, the second argument might be defaultValue string or options object
      const options = typeof opts === 'string' ? params : opts;

      if (key === 'chat.no_agents_yet') return 'No agents yet';
      if (key === 'chat.you_and_one') return `You + ${options?.name}`;
      if (key === 'chat.you_and_two') return `You, ${options?.name1} & ${options?.name2}`;
      if (key === 'chat.you_plus_n_agents') return `You + ${options?.count} agents`;
      if (key === 'chat.room_accessibility') return `${options?.name}${options?.suffix || ''}`;
      if (key === 'chat.unread') return options?.defaultValue || 'unread';
      if (key === 'chat.pin') return 'Pin chat';
      if (key === 'chat.unpin') return 'Unpin chat';
      if (key === 'chat.tap_to_continue') return 'Tap to continue';
      return key;
    },
  }),
}));

const mockRoom = { id: 'r1', name: 'Test Room', created_at: '', updated_at: '' } as ChatRoom;
const agent1 = { id: 'a1', name: 'Agent1' } as any;
const agent2 = { id: 'a2', name: 'Agent2' } as any;
const agent3 = { id: 'a3', name: 'Agent3' } as any;

describe('RoomCard', () => {
  it('renders room name and initial', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<RoomCard room={mockRoom} agents={[]} onPress={onPressMock} />);

    expect(getByText('Test Room')).toBeTruthy();
    expect(getByText('T')).toBeTruthy();
  });

  it('displays 0 agents label', () => {
    const { getByText } = render(<RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} />);
    expect(getByText('No agents yet')).toBeTruthy();
  });

  it('displays 1 agent label', () => {
    const { getByText } = render(<RoomCard room={mockRoom} agents={[agent1]} onPress={jest.fn()} />);
    expect(getByText('You + Agent1')).toBeTruthy();
  });

  it('displays 2 agents label', () => {
    const { getByText } = render(<RoomCard room={mockRoom} agents={[agent1, agent2]} onPress={jest.fn()} />);
    expect(getByText('You, Agent1 & Agent2')).toBeTruthy();
  });

  it('displays 3+ agents label', () => {
    const { getByText } = render(<RoomCard room={mockRoom} agents={[agent1, agent2, agent3]} onPress={jest.fn()} />);
    expect(getByText('You + 3 agents')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<RoomCard room={mockRoom} agents={[]} onPress={onPressMock} />);

    fireEvent.press(getByText('Test Room'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('shows unread dot and styles when unread', () => {
    const { getByLabelText } = render(<RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} unread={true} />);
    expect(getByLabelText(/unread/)).toBeTruthy();
  });

  it('shows pinned icon when pinned', () => {
    const { getAllByLabelText } = render(<RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} pinned={true} onTogglePin={jest.fn()} />);
    const pinBtn = getAllByLabelText(/Unpin chat/);
    expect(pinBtn.length).toBeGreaterThan(0);
  });
});
