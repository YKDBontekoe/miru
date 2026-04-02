import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInputBar } from '../../../src/components/ChatInputBar';
import { AgentActivityIndicator } from '../../../src/components/AgentActivityIndicator';
import { useChatStore } from '../../../src/store/useChatStore';
import { useAgentStore } from '../../../src/store/useAgentStore';
import { ApiService } from '../../../src/core/api/ApiService';
import { Agent } from '../../../src/core/models';
import { QuickViewAgentSheet } from '../../../src/components/agents/QuickViewAgentSheet';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { ManageAgentsModal } from '@/components/chat/ManageAgentsModal';
import { ChatRoomEmptyState } from '../../../src/components/chat/ChatRoomEmptyState';
import { useChatRoomSetup } from '../../../src/hooks/useChatRoomSetup';
import { getAgentColor } from '../../../src/utils/chatUtils';

const C = {
  bg: '#F8F8FC',
  primary: '#2563EB',
};

export default function ChatRoomScreen() {
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const {
    messages,
    agentActivity,
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoadingMessages,
    rooms,
    addAgentToRoom,
  } = useChatStore();

  const { agents } = useAgentStore();
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [quickViewAgent, setQuickViewAgent] = useState<Agent | null>(null);

  const flatListRef = useRef<FlatList>(null);
  const messageCount = useRef(0);

  const { roomAgents, setRoomAgents } = useChatRoomSetup(roomId);

  const room = React.useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const roomMessages = React.useMemo(() => messages[roomId ?? ''] ?? [], [messages, roomId]);
  const currentActivity = React.useMemo(
    () => (roomId ? agentActivity[roomId] : null),
    [agentActivity, roomId]
  );
  const agentMap = React.useMemo(
    () => Object.fromEntries(roomAgents.map((a) => [a.id, a])),
    [roomAgents]
  );

  const availableAgents = React.useMemo(() => {
    return agents.filter((a) => !roomAgents.some((r) => r.id === a.id));
  }, [agents, roomAgents]);

  // Scroll to end only when the list grows (new message added)
  useEffect(() => {
    if (roomMessages.length > messageCount.current) {
      messageCount.current = roomMessages.length;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [roomMessages.length]);

  // Scroll to end when activity indicator appears/disappears
  useEffect(() => {
    if (currentActivity) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [currentActivity]);

  const handleSend = useCallback(() => {
    if (!inputText.trim() || !roomId || isStreaming) return;
    const text = inputText.trim();
    setInputText('');
    sendMessage(roomId, text);
  }, [inputText, roomId, isStreaming, sendMessage]);

  const handleRetry = useCallback(
    (content: string) => {
      if (!roomId) return;
      sendMessage(roomId, content);
    },
    [roomId, sendMessage]
  );

  const handleAddAgent = async (agentId: string) => {
    if (!roomId) return;
    await addAgentToRoom(roomId, agentId);
    const updated = await ApiService.getRoomAgents(roomId);
    setRoomAgents(updated);
    setIsModalVisible(false);
  };

  const handleRemoveAgent = async (agentId: string) => {
    if (!roomId) return;
    try {
      await ApiService.removeAgentFromRoom(roomId, agentId);
      setRoomAgents((prev) => prev.filter((a) => a.id !== agentId));
    } catch {
      Alert.alert('Error', 'Could not remove agent from chat. Please try again.');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      <ChatRoomHeader
        room={room}
        roomAgents={roomAgents}
        onBack={() => router.back()}
        onQuickViewAgent={setQuickViewAgent}
        onManageAgentsPress={() => setIsModalVisible(true)}
        getAgentColor={getAgentColor}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
        style={{ flex: 1 }}
      >
        {/* Message list */}
        {isLoadingMessages && roomMessages.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={roomMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{
              paddingHorizontal: 16,
              paddingTop: 16,
              paddingBottom: 8,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={<ChatRoomEmptyState roomAgents={roomAgents} />}
            renderItem={({ item }) => {
              const agent = item.agent_id ? agentMap[item.agent_id] : undefined;
              const isLastUserMsg =
                !item.user_id &&
                item.status === 'error' &&
                roomMessages.findIndex((m) => m.id === item.id) > 0;
              const prevUserMsg = isLastUserMsg
                ? roomMessages
                    .slice(
                      0,
                      roomMessages.findIndex((m) => m.id === item.id)
                    )
                    .reverse()
                    .find((m) => !!m.user_id)
                : undefined;

              return (
                <ChatBubble
                  text={item.content}
                  isUser={!!item.user_id}
                  status={item.status}
                  agentName={
                    agent?.name ??
                    (item.agent_id && item.agent_id !== 'assistant' ? 'Assistant' : undefined)
                  }
                  timestamp={item.created_at}
                  onRetry={prevUserMsg ? () => handleRetry(prevUserMsg.content) : undefined}
                />
              );
            }}
            ListFooterComponent={
              currentActivity ? <AgentActivityIndicator activity={currentActivity} /> : null
            }
          />
        )}

        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          placeholder={roomAgents.length > 0 ? `Message ${roomAgents[0].name}...` : 'Message...'}
        />
      </KeyboardAvoidingView>

      <ManageAgentsModal
        isVisible={isModalVisible}
        onClose={() => setIsModalVisible(false)}
        roomAgents={roomAgents}
        availableAgents={availableAgents}
        agents={agents}
        onAddAgent={handleAddAgent}
        onRemoveAgent={handleRemoveAgent}
        getAgentColor={getAgentColor}
      />

      {/* Quick-view agent popover */}
      {quickViewAgent && (
        <QuickViewAgentSheet
          agent={quickViewAgent}
          onClose={() => setQuickViewAgent(null)}
          onAdd={handleAddAgent}
          onRemove={handleRemoveAgent}
          roomAgents={roomAgents}
          getAgentColor={getAgentColor}
        />
      )}
    </SafeAreaView>
  );
}
