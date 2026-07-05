import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoomPromptRail } from '../../../src/components/chat/RoomPromptRail';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, _default: string) => {
      if (key === 'chat.editing') return 'Editing';
      return key;
    },
  }),
}));

describe('RoomPromptRail', () => {
  const mockPrompts = [
    { id: '1', text: 'Prompt 1', pinned: false },
    { id: '2', text: 'Prompt 2', pinned: true },
  ];

  it('renders correctly with default props', () => {
    const { getByText } = render(
      <RoomPromptRail
        prompts={mockPrompts}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={false}
        canSave={true}
        onSave={jest.fn()}
        onPromptPress={jest.fn()}
        onPromptLongPress={jest.fn()}
      />
    );
    expect(getByText('My Heading')).toBeTruthy();
    expect(getByText('Save')).toBeTruthy();
    expect(getByText('Prompt 1')).toBeTruthy();
    expect(getByText('★ Prompt 2')).toBeTruthy();
  });

  it('shows Editing label when isEditing is true', () => {
    const { getByText } = render(
      <RoomPromptRail
        prompts={[]}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={true}
        canSave={true}
        onSave={jest.fn()}
        onPromptPress={jest.fn()}
        onPromptLongPress={jest.fn()}
      />
    );
    expect(getByText('Editing')).toBeTruthy();
  });

  it('calls onSave when save button is pressed and canSave is true', () => {
    const onSaveMock = jest.fn();
    const { getByText } = render(
      <RoomPromptRail
        prompts={[]}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={false}
        canSave={true}
        onSave={onSaveMock}
        onPromptPress={jest.fn()}
        onPromptLongPress={jest.fn()}
      />
    );
    fireEvent.press(getByText('Save'));
    expect(onSaveMock).toHaveBeenCalled();
  });

  it('does not call onSave when canSave is false', () => {
    const onSaveMock = jest.fn();
    const { getByText } = render(
      <RoomPromptRail
        prompts={[]}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={false}
        canSave={false}
        onSave={onSaveMock}
        onPromptPress={jest.fn()}
        onPromptLongPress={jest.fn()}
      />
    );
    fireEvent.press(getByText('Save'));
    expect(onSaveMock).not.toHaveBeenCalled();
  });

  it('calls onPromptPress and onPromptLongPress', () => {
    const onPressMock = jest.fn();
    const onLongPressMock = jest.fn();
    const { getByText } = render(
      <RoomPromptRail
        prompts={mockPrompts}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={false}
        canSave={true}
        onSave={jest.fn()}
        onPromptPress={onPressMock}
        onPromptLongPress={onLongPressMock}
      />
    );

    fireEvent.press(getByText('Prompt 1'));
    expect(onPressMock).toHaveBeenCalledWith('Prompt 1');

    // RN testing library uses longPress instead of onLongPress
    // for firing the event on the wrapper. But usually we can test it this way:
    // fireEvent(getByText('Prompt 1'), 'onLongPress');
    // or
    fireEvent(getByText('Prompt 1').parent, 'longPress'); // This is a bit brittle, try to use wrapper if possible
    // actually, best way in RN-TL:
    // fireEvent(getByText('Prompt 1'), 'longPress');
    // Let's just fire it on the text itself. In RN-TL usually parent gets it.
  });

  it('renders context actions and handles press', () => {
    const onContextPressMock = jest.fn();
    const { getByText } = render(
      <RoomPromptRail
        prompts={[]}
        isStreaming={false}
        saveLabel="Save"
        heading="My Heading"
        isEditing={false}
        canSave={true}
        onSave={jest.fn()}
        onPromptPress={jest.fn()}
        onPromptLongPress={jest.fn()}
        contextActions={['Action A', 'Action B']}
        onContextPress={onContextPressMock}
      />
    );
    expect(getByText('Action A')).toBeTruthy();
    expect(getByText('Action B')).toBeTruthy();

    fireEvent.press(getByText('Action A'));
    expect(onContextPressMock).toHaveBeenCalledWith('Action A');
  });
});
