import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { AgentPill } from '../../../src/components/chat/AgentPill';

// Mock getAgentColor
jest.mock('../../../src/utils/colors', () => ({
  getAgentColor: jest.fn().mockReturnValue('#ff0000'),
}));

const mockAgent = {
  id: '1',
  name: 'TestAgent',
  description: '',
  personality: '',
  goals: [],
  created_at: '',
  updated_at: '',
} as any;

describe('AgentPill', () => {
  it('renders correctly with agent name', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AgentPill agent={mockAgent} onPress={onPressMock} />);

    expect(getByText('TestAgent')).toBeTruthy();
    expect(getByText('T')).toBeTruthy(); // Initial
  });

  it('calls onPress when pressed', () => {
    const onPressMock = jest.fn();
    const { getByText } = render(<AgentPill agent={mockAgent} onPress={onPressMock} />);

    fireEvent.press(getByText('TestAgent'));
    expect(onPressMock).toHaveBeenCalledTimes(1);
  });

  it('handles missing agent name gracefully', () => {
     const onPressMock = jest.fn();
     const { getByText } = render(<AgentPill agent={{...mockAgent, name: ''}} onPress={onPressMock} />);
     expect(getByText('?')).toBeTruthy();
  });
});
