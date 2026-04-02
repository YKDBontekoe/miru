import { useEffect, useState } from 'react';
import { useChatStore } from '../store/useChatStore';
import { useAgentStore } from '../store/useAgentStore';
import { ApiService } from '../core/api/ApiService';
import { Agent } from '../core/models';

export function useChatRoomSetup(roomId: string | undefined) {
  const { fetchMessages, connectHub, disconnectHub, joinRoom, leaveRoom } = useChatStore();
  const { fetchAgents } = useAgentStore();
  const [roomAgents, setRoomAgents] = useState<Agent[]>([]);

  useEffect(() => {
    if (!roomId) return;

    fetchMessages(roomId);
    fetchAgents();
    ApiService.getRoomAgents(roomId)
      .then(setRoomAgents)
      .catch(() => {});

    connectHub()
      .then(() => {
        joinRoom(roomId);
      })
      .catch(() => {
        useChatStore.setState({
          hubError: 'Failed to connect to chat. Please go back and try again.',
        });
      });

    return () => {
      if (roomId) leaveRoom(roomId);
      disconnectHub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

  return { roomAgents, setRoomAgents };
}
