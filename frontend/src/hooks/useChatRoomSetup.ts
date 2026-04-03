import { useEffect, useState, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useChatStore } from '@/store/useChatStore';
import { useAgentStore } from '@/store/useAgentStore';
import { ApiService } from '@/core/api/ApiService';
import { getApiErrorMessage } from '@/core/api/errors';
import { Agent } from '@/core/models';

export function useChatRoomSetup(roomId: string | undefined) {
  const { t } = useTranslation();
  const fetchMessages = useChatStore((s) => s.fetchMessages);
  const connectHub = useChatStore((s) => s.connectHub);
  const disconnectHub = useChatStore((s) => s.disconnectHub);
  const joinRoom = useChatStore((s) => s.joinRoom);
  const leaveRoom = useChatStore((s) => s.leaveRoom);
  const fetchAgents = useAgentStore((s) => s.fetchAgents);

  const [roomAgents, setRoomAgents] = useState<Agent[]>([]);
  const [roomAgentsError, setRoomAgentsError] = useState<string | null>(null);

  const currentRoomRef = useRef<string | null>(null);

  const refetchRoomAgents = useCallback(() => {
    if (!roomId) return;
    setRoomAgentsError(null);
    ApiService.getRoomAgents(roomId)
      .then(setRoomAgents)
      .catch((error: unknown) => {
        setRoomAgentsError(
          getApiErrorMessage(error, t('chat.failed_to_load_agents') || 'Failed to load agents.')
        );
      });
  }, [roomId, t]);

  useEffect(() => {
    if (!roomId) return;
    currentRoomRef.current = roomId;

    fetchMessages(roomId);
    fetchAgents();
    refetchRoomAgents();

    connectHub()
      .then(() => {
        if (currentRoomRef.current === roomId) {
          joinRoom(roomId);
        }
      })
      .catch(() => {
        if (currentRoomRef.current === roomId) {
          useChatStore.setState({
            hubError:
              t('chat.failed_to_connect') || 'Failed to connect to chat. Please go back and try again.',
          });
        }
      });

    return () => {
      currentRoomRef.current = null;
      if (roomId) leaveRoom(roomId);
      disconnectHub();
    };
  }, [
    roomId,
    fetchMessages,
    fetchAgents,
    connectHub,
    joinRoom,
    leaveRoom,
    disconnectHub,
    refetchRoomAgents,
    t,
  ]);

  return { roomAgents, setRoomAgents, roomAgentsError, refetchRoomAgents };
}
