import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoomCard } from '../../../src/components/chat/RoomCard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _default: string, params?: any) => {
      if (key === 'chat.no_agents_yet') return 'No agents yet';
      if (key === 'chat.you_and_one') return `You + ${params.name}`;
      if (key === 'chat.you_and_two') return `You, ${params.name1} & ${params.name2}`;
      if (key === 'chat.you_plus_n_agents') return `You + ${params.count} agents`;
      if (key === 'chat.unread') return 'unread';
      if (key === 'chat.unpin') return 'Unpin chat';
      if (key === 'chat.pin') return 'Pin chat';
      return key;
    },
  }),
}));

const mockRoom = { id: 'r1', name: 'Test Room', created_at: '', updated_at: '2023-01-01T00:00:00Z' };
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
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[agent1]} onPress={jest.fn()} />
    );
    expect(getByText('You + Agent1')).toBeTruthy();
  });

  it('displays 2 agents label', () => {
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[agent1, agent2]} onPress={jest.fn()} />
    );
    expect(getByText('You, Agent1 & Agent2')).toBeTruthy();
  });

  it('displays 3+ agents label', () => {
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[agent1, agent2, agent3]} onPress={jest.fn()} />
    );
    expect(getByText('You + 3 agents')).toBeTruthy();
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<RoomCard room={mockRoom} agents={[]} onPress={onPressMock} />);

    fireEvent.press(getByText('Test Room'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('displays unread state properly', () => {
    const { getByLabelText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} unread={true} />
    );
    expect(getByLabelText('chat.room_accessibility')).toBeTruthy();
  });

  it('displays pinned state properly', () => {
    const { getByLabelText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} pinned={true} onTogglePin={jest.fn()} />
    );
    expect(getByLabelText('Unpin chat')).toBeTruthy();
  });

  it('toggles pin', () => {
    const onToggleMock = jest.fn();
    const { getByLabelText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} onTogglePin={onToggleMock} pinned={false} />
    );
    fireEvent.press(getByLabelText('Pin chat'));
    expect(onToggleMock).toHaveBeenCalledTimes(1);
  });

  it('formats lastMessageAt and displays preview', () => {
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={jest.fn()} lastMessage="Hello World" lastMessageAt="2023-01-01T00:00:00Z" />
    );
    expect(getByText('Hello World')).toBeTruthy();
    expect(getByText('Jan 1')).toBeTruthy(); // This is locale dependent but typically 'Jan 1' on English CI
  });
});
