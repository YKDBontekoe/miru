import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatInputBar } from '../src/components/ChatInputBar';

describe('ChatInputBar', () => {
  it('renders correctly with default props', () => {
    const { getByPlaceholderText } = render(
      <ChatInputBar
        value=""
        onChangeText={() => {}}
        onSend={() => {}}
        isStreaming={false}
      />
    );
    expect(getByPlaceholderText('Message...')).toBeTruthy();
  });

  it('calls onChangeText when text changes', () => {
    const onChangeTextMock = jest.fn();
    const { getByPlaceholderText } = render(
      <ChatInputBar
        value=""
        onChangeText={onChangeTextMock}
        onSend={() => {}}
        isStreaming={false}
      />
    );
    fireEvent.changeText(getByPlaceholderText('Message...'), 'New text');
    expect(onChangeTextMock).toHaveBeenCalledWith('New text');
  });

  it('calls onSend when send button is clicked and canSend is true', () => {
    const onSendMock = jest.fn();
    const { UNSAFE_getByProps } = render(
      <ChatInputBar
        value="Hello"
        onChangeText={() => {}}
        onSend={onSendMock}
        isStreaming={false}
      />
    );
    const button = UNSAFE_getByProps({ disabled: false });
    fireEvent.press(button);
    expect(onSendMock).toHaveBeenCalledTimes(1);

    fireEvent(button, 'pressIn');
    fireEvent(button, 'pressOut');
  });

  it('calls onStop when stop button is clicked while streaming', () => {
      const onStopMock = jest.fn();
      const { UNSAFE_getByProps } = render(
        <ChatInputBar
          value=""
          onChangeText={() => {}}
          onSend={() => {}}
          isStreaming={true}
          onStop={onStopMock}
        />
      );

      const button = UNSAFE_getByProps({ onPress: onStopMock });
      fireEvent.press(button);
      expect(onStopMock).toHaveBeenCalledTimes(1);

      fireEvent(button, 'pressIn');
      fireEvent(button, 'pressOut');
  });

  it('does not call onSend if canSend is false', () => {
    const onSendMock = jest.fn();
    const { UNSAFE_getByProps } = render(
      <ChatInputBar
        value="  "
        onChangeText={() => {}}
        onSend={onSendMock}
        isStreaming={false}
      />
    );
    // Find the handleSend wrapper
    const button = UNSAFE_getByProps({ disabled: true });
    fireEvent.press(button);
    expect(onSendMock).not.toHaveBeenCalled();
  });
});
