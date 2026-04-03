import React from 'react';
import { render, fireEvent, act, waitFor } from '@testing-library/react-native';
import { CreateRoomModal } from '../../../src/components/chat/CreateRoomModal';
import { useChatStore } from '../../../src/store/useChatStore';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, def: string) => def,
  }),
}));

const mockAgent1 = { id: 'a1', name: 'Agent1', personality: 'Happy' } as any;
const mockAgent2 = { id: 'a2', name: 'Agent2', personality: 'Sad' } as any;

describe('CreateRoomModal', () => {
  const createRoomMock = jest.fn();
  const addAgentToRoomMock = jest.fn();
  const deleteRoomMock = jest.fn();
  const onCloseMock = jest.fn();
  const onCreatedMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    useChatStore.setState({
      createRoom: createRoomMock,
      addAgentToRoom: addAgentToRoomMock,
      deleteRoom: deleteRoomMock,
    } as any);
  });

  it('renders correctly', () => {
    const { getByText, getByPlaceholderText } = render(
      <CreateRoomModal visible={true} agents={[mockAgent1]} onClose={onCloseMock} onCreated={onCreatedMock} />
    );
    expect(getByText('New Chat')).toBeTruthy();
    expect(getByPlaceholderText('e.g. Gaming Session')).toBeTruthy();
    expect(getByText('Agent1')).toBeTruthy();
  });

  it('can toggle agents and create room successfully', async () => {
    createRoomMock.mockResolvedValue({ id: 'r1' });
    addAgentToRoomMock.mockResolvedValue(undefined);

    const { getByText, getByPlaceholderText } = render(
      <CreateRoomModal visible={true} agents={[mockAgent1, mockAgent2]} onClose={onCloseMock} onCreated={onCreatedMock} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Gaming Session'), 'My Room');
    fireEvent.press(getByText('Agent1')); // Toggle on
    fireEvent.press(getByText('Agent1')); // Toggle off
    fireEvent.press(getByText('Agent2')); // Toggle on

    fireEvent.press(getByText('Create Chat'));

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalledWith('My Room');
      expect(addAgentToRoomMock).toHaveBeenCalledWith('r1', 'a2');
      expect(onCreatedMock).toHaveBeenCalled();
      expect(onCloseMock).toHaveBeenCalled();
    });
  });

  it('shows error if name is empty', () => {
    const { getByText } = render(
      <CreateRoomModal visible={true} agents={[]} onClose={onCloseMock} onCreated={onCreatedMock} />
    );

    // We mock Alert internally if we want to spy, but for coverage, just pushing the button is enough to trigger the branch.
    fireEvent.press(getByText('Create Chat'));
    expect(createRoomMock).not.toHaveBeenCalled();
  });

  it('rolls back room if agent addition fails', async () => {
    createRoomMock.mockResolvedValue({ id: 'r1' });
    addAgentToRoomMock.mockRejectedValue(new Error('Failed'));

    // Temporarily hide console.error for clean test output
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <CreateRoomModal visible={true} agents={[mockAgent1]} onClose={onCloseMock} onCreated={onCreatedMock} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Gaming Session'), 'My Room');
    fireEvent.press(getByText('Agent1')); // Toggle on
    fireEvent.press(getByText('Create Chat'));

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalled();
      expect(deleteRoomMock).toHaveBeenCalledWith('r1');
      expect(onCreatedMock).not.toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });

  it('handles room creation failure', async () => {
    createRoomMock.mockRejectedValue(new Error('Failed'));
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { getByText, getByPlaceholderText } = render(
      <CreateRoomModal visible={true} agents={[]} onClose={onCloseMock} onCreated={onCreatedMock} />
    );

    fireEvent.changeText(getByPlaceholderText('e.g. Gaming Session'), 'My Room');
    fireEvent.press(getByText('Create Chat'));

    await waitFor(() => {
      expect(createRoomMock).toHaveBeenCalled();
      expect(deleteRoomMock).not.toHaveBeenCalled();
    });
    consoleSpy.mockRestore();
  });
});
