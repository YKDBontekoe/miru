import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react-native';

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View } = require('react-native');
  return {
    __esModule: true,
    default: {
      View: View,
      createAnimatedComponent: jest.fn().mockImplementation((component) => component),
    },
    FadeIn: { duration: jest.fn().mockReturnValue({}) },
    SlideInUp: { duration: jest.fn().mockReturnValue({}) },
    SlideOutDown: { duration: jest.fn().mockReturnValue({}) },
    useSharedValue: jest.fn().mockReturnValue({ value: 1 }),
    useAnimatedStyle: jest.fn().mockReturnValue({}),
  };
});

import { CreateAgentForm } from '@/components/agents/create/CreateAgentForm';
import { haptic } from '@/utils/haptics';

jest.mock('@/utils/haptics', () => ({
  haptic: {
    selection: jest.fn(),
  },
}));

describe('CreateAgentForm', () => {
  const mockSetName = jest.fn();
  const mockSetSelectedTone = jest.fn();
  const mockSetPersonality = jest.fn();
  const mockSetDescription = jest.fn();
  const mockSetGoals = jest.fn();
  const mockOnSave = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const defaultProps = {
    name: '',
    setName: mockSetName,
    selectedTone: '',
    setSelectedTone: mockSetSelectedTone,
    personality: '',
    setPersonality: mockSetPersonality,
    description: '',
    setDescription: mockSetDescription,
    goals: [],
    setGoals: mockSetGoals,
    isSaving: false,
    onSave: mockOnSave,
    errorMsg: '',
  };

  it('renders form fields and buttons', () => {
    render(<CreateAgentForm {...defaultProps} />);
    expect(screen.getByText('agent.name')).toBeTruthy();

    expect(screen.getByText('agent.personality')).toBeTruthy();
  });

  it('updates name and personality fields', () => {
    render(<CreateAgentForm {...defaultProps} />);
    const nameInput = screen.getByPlaceholderText('agent.name_placeholder');
    fireEvent.changeText(nameInput, 'New Agent');
    expect(mockSetName).toHaveBeenCalledWith('New Agent');
  });

  it('triggers onSave when save button pressed', () => {
    render(<CreateAgentForm {...defaultProps} />);
    const saveButton = screen.getByText('agent.create_persona');
    fireEvent.press(saveButton);
    expect(mockOnSave).toHaveBeenCalled();
  });
});
