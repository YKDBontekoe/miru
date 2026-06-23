import React from 'react';
import { View, TextInput, TouchableOpacity } from 'react-native';
import { render, fireEvent, waitFor, screen } from '@testing-library/react-native';

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

import { CreateAgentSheet } from '@/components/agents/CreateAgentSheet';
import { useAgentStore } from '@/store/useAgentStore';
import { haptic } from '@/utils/haptics';

// Mock dependencies
jest.mock('@/store/useAgentStore');
jest.mock('@/utils/haptics', () => ({
  haptic: {
    selection: jest.fn(),
    light: jest.fn(),
    success: jest.fn(),
    error: jest.fn(),
  },
}));

jest.mock('@/components/agents/TemplateGallerySheet', () => ({
  TemplateGallerySheet: ({ visible, onSelect, onClose }: any) => {
    const { View, TouchableOpacity } = require('react-native');
    if (!visible) return null;
    return (
      <View testID="mock-template-gallery">
        <TouchableOpacity
          testID="select-template-btn"
          onPress={() => onSelect({ name: 'Test Template', personality: 'Template persona' })}
        />
        <TouchableOpacity testID="close-template-btn" onPress={onClose} />
      </View>
    );
  },
}));

jest.mock('@/components/agents/create', () => ({
  CreateAgentForm: ({ name, setName, isSaving, onSave }: any) => {
    const { View, TextInput, TouchableOpacity } = require('react-native');
    return (
      <View testID="mock-create-agent-form">
        <TextInput testID="name-input" value={name} onChangeText={(text: any) => setName(text)} />
        <TouchableOpacity testID="save-btn" disabled={isSaving} onPress={onSave} />
      </View>
    );
  },
}));

describe('CreateAgentSheet', () => {
  const mockCreateAgent = jest.fn();
  const mockGenerateAgent = jest.fn();
  const mockOnClose = jest.fn();
  const mockOnCreated = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (useAgentStore as unknown as jest.Mock).mockReturnValue({
      createAgent: mockCreateAgent,
      generateAgent: mockGenerateAgent,
    });
  });

  it('renders correctly when visible', () => {
    render(<CreateAgentSheet visible={true} onClose={mockOnClose} onCreated={mockOnCreated} />);
    expect(screen.getByText('New Persona')).toBeTruthy();
    expect(screen.getByText('Generate with AI')).toBeTruthy();
  });

  it('can open template gallery', () => {
    render(<CreateAgentSheet visible={true} onClose={mockOnClose} onCreated={mockOnCreated} />);
    fireEvent.press(screen.getByText('Browse persona templates'));
    expect(screen.getByTestId('mock-template-gallery')).toBeTruthy();
  });

  it('handles surprise me button', () => {
    render(<CreateAgentSheet visible={true} onClose={mockOnClose} onCreated={mockOnCreated} />);
    fireEvent.press(screen.getByText('Surprise me'));
    expect(haptic.selection).toHaveBeenCalled();
  });
});
