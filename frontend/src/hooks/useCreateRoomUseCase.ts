import { useState } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/useChatStore';

interface UseCreateRoomUseCaseProps {
  name: string;
  selectedAgentIds: string[];
  onCreated: () => void;
}

export function useCreateRoomUseCase({
  name,
  selectedAgentIds,
  onCreated,
}: UseCreateRoomUseCaseProps) {
  const { t } = useTranslation();
  const [isSaving, setIsSaving] = useState(false);
  const { createRoom, addAgentToRoom } = useChatStore();

  const execute = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('createRoom.nameRequired', 'Name required'),
        t('createRoom.nameRequiredDesc', 'Please enter a name for this chat.')
      );
      return;
    }

    setIsSaving(true);

    try {
      const room = await createRoom(name.trim());
      try {
        const promises = selectedAgentIds.map((agentId) => addAgentToRoom(room.id, agentId));
        await Promise.all(promises);
        onCreated();
      } catch (err) {
        // Rollback room creation if agent additions fail
        const { deleteRoom } = useChatStore.getState();
        if (deleteRoom) {
          await deleteRoom(room.id);
        }
        console.error('Failed to add agents to room, rolling back room creation', err);
        Alert.alert(
          t('createRoom.error', 'Error'),
          t('createRoom.failedToAddAgents', 'Failed to link agents. Please try again.')
        );
      }
    } catch (err) {
      console.error('Failed to create room', err);
      Alert.alert(
        t('createRoom.error', 'Error'),
        t('createRoom.failedToCreate', 'Failed to create chat. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  return { execute, isSaving };
}
