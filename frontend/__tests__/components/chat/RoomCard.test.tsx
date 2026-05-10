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
      return key;
    },
  }),
}));

const mockRoom = { id: 'r1', name: 'Test Room', created_at: '', updated_at: '' };
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

  it('renders unread state', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={onPressMock} unread={true} />
    );

    // Assuming the unread dot is rendered, we don't have a specific text but we can check it renders without crashing
    expect(getByText('Test Room')).toBeTruthy();
  });

  it('renders pinned state and calls onTogglePin', () => {
    const onPressMock = jest.fn();
    const onTogglePinMock = jest.fn();
    const { getByLabelText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={onPressMock} pinned={true} onTogglePin={onTogglePinMock} />
    );

    // Test unpin accessibility label
    const pinButton = getByLabelText('chat.unpin');
    expect(pinButton).toBeTruthy();

    fireEvent.press(pinButton);
    expect(onTogglePinMock).toHaveBeenCalledTimes(1);
  });

  it('renders unpinned state and calls onTogglePin', () => {
    const onPressMock = jest.fn();
    const onTogglePinMock = jest.fn();
    const { getByLabelText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={onPressMock} pinned={false} onTogglePin={onTogglePinMock} />
    );

    // Test pin accessibility label
    const pinButton = getByLabelText('chat.pin');
    expect(pinButton).toBeTruthy();

    fireEvent.press(pinButton);
    expect(onTogglePinMock).toHaveBeenCalledTimes(1);
  });

  it('renders lastMessage and lastMessageAt', () => {
    const onPressMock = jest.fn();
    const lastMessageDate = new Date().toISOString();
    const { getByText } = render(
      <RoomCard room={mockRoom} agents={[]} onPress={onPressMock} lastMessage="Hello world" lastMessageAt={lastMessageDate} />
    );

    expect(getByText('Hello world')).toBeTruthy();
  });
});
