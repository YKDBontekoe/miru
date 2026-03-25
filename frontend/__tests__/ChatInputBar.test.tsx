import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { ChatInputBar } from '../src/components/ChatInputBar';

describe('ChatInputBar', () => {
  const onChangeTextMock = jest.fn();
  const onSendMock = jest.fn();
  const onStopMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly and takes input', () => {
    const { getByPlaceholderText } = render(
      <ChatInputBar
        value="Hello"
        onChangeText={onChangeTextMock}
        onSend={onSendMock}
        isStreaming={false}
      />
    );

    const input = getByPlaceholderText('Message...');
    expect(input.props.value).toBe('Hello');

    fireEvent.changeText(input, 'Hello World');
    expect(onChangeTextMock).toHaveBeenCalledWith('Hello World');
  });

  it('calls onSend when the send button is pressed with valid text', () => {
    const { getByTestId } = render(
      <ChatInputBar
        value="Hello"
        onChangeText={onChangeTextMock}
        onSend={onSendMock}
        isStreaming={false}
      />
    );

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    expect(onSendMock).toHaveBeenCalled();
  });

  it('disables the send button if text is empty', () => {
    const { getByTestId } = render(
      <ChatInputBar
        value="   "
        onChangeText={onChangeTextMock}
        onSend={onSendMock}
        isStreaming={false}
      />
    );

    const sendButton = getByTestId('send-button');
    fireEvent.press(sendButton);
    expect(onSendMock).not.toHaveBeenCalled();

    // Simulate pressIn and pressOut to trigger reanimated logic
    fireEvent(sendButton, 'onPressIn');
    fireEvent(sendButton, 'onPressOut');
  });

  it('shows stop button and calls onStop when streaming', () => {
    const { getByTestId } = render(
      <ChatInputBar
        value=""
        onChangeText={onChangeTextMock}
        onSend={onSendMock}
        isStreaming={true}
        onStop={onStopMock}
      />
    );

    const stopButton = getByTestId('stop-button');
    fireEvent.press(stopButton);
    expect(onStopMock).toHaveBeenCalled();

    // Simulate pressIn and pressOut to trigger reanimated logic
    fireEvent(stopButton, 'onPressIn');
    fireEvent(stopButton, 'onPressOut');
  });
});
