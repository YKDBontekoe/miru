import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../../src/components/AppText';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInputBar } from '../../../src/components/ChatInputBar';
import { AgentActivityIndicator } from '../../../src/components/AgentActivityIndicator';
import { useChatStore } from '../../../src/store/useChatStore';
import { useAgentStore } from '../../../src/store/useAgentStore';
import { ApiService } from '../../../src/core/api/ApiService';
import { Agent } from '../../../src/core/models';

const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
};

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

export default function ChatRoomScreen() {
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    messages,
    agentActivity,
    fetchMessages,
    sendMessage,
    stopStreaming,
    isStreaming,
    isLoadingMessages,
    rooms,
    addAgentToRoom,
    connectHub,
    disconnectHub,
    joinRoom,
    leaveRoom,
  } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [roomAgents, setRoomAgents] = useState<Agent[]>([]);
  const flatListRef = useRef<FlatList>(null);
  const messageCount = useRef(0);

  const room = rooms.find((r) => r.id === roomId);
  const roomMessages = messages[roomId ?? ''] ?? [];
  const currentActivity = roomId ? agentActivity[roomId] : null;
  const agentMap = Object.fromEntries(roomAgents.map((a) => [a.id, a]));

  // Connect hub and join room when screen mounts
  useEffect(() => {
    if (!roomId) return;

    fetchMessages(roomId);
    fetchAgents();
    ApiService.getRoomAgents(roomId)
      .then(setRoomAgents)
      .catch(() => {});

    connectHub().then(() => {
      joinRoom(roomId);
    });

    return () => {
      if (roomId) leaveRoom(roomId);
      disconnectHub();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId]);

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 12,
          paddingVertical: 10,
          borderBottomWidth: 1,
          borderBottomColor: C.border,
          backgroundColor: C.surface,
          gap: 8,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>

        <View
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            backgroundColor: C.primarySurface,
            borderWidth: 1,
            borderColor: `${C.primary}25`,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText style={{ color: C.primary, fontWeight: '700', fontSize: 16 }}>
            {room?.name[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>

        <View style={{ flex: 1 }}>
          <AppText style={{ fontSize: 16, fontWeight: '600', color: C.text }} numberOfLines={1}>
            {room?.name ?? 'Chat'}
          </AppText>
          {roomAgents.length > 0 && (
            <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
              {roomAgents.map((a) => a.name).join(', ')}
            </AppText>
          )}
        </View>

        {/* Agent avatars row */}
        {roomAgents.length > 0 && (
          <View style={{ flexDirection: 'row' }}>
            {roomAgents.slice(0, 3).map((agent, i) => {
              const color = getAgentColor(agent.name);
              return (
                <View
                  key={agent.id}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    backgroundColor: `${color}20`,
                    borderWidth: 1.5,
                    borderColor: C.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginLeft: i === 0 ? 0 : -8,
                  }}
                >
                  <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {agent.name[0].toUpperCase()}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity
          onPress={() => setIsModalVisible(true)}
          style={{
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: C.surfaceHigh,
            borderWidth: 1,
            borderColor: C.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person-add-outline" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>

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
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingVertical: 64,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 32,
                    backgroundColor: C.primarySurface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 16,
                  }}
                >
                  <Ionicons name="chatbubble-ellipses-outline" size={30} color={C.primary} />
                </View>
                <AppText
                  style={{ color: C.text, fontWeight: '600', fontSize: 16, marginBottom: 6 }}
                >
                  Start a conversation
                </AppText>
                <AppText style={{ color: C.muted, textAlign: 'center', fontSize: 14 }}>
                  {roomAgents.length > 0
                    ? `${roomAgents.map((a) => a.name).join(', ')} ${roomAgents.length === 1 ? 'is' : 'are'} ready to help.`
                    : 'Add an agent to get started.'}
                </AppText>
              </View>
            }
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

      {/* Add Agent Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '70%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
              }}
            >
              <AppText variant="h2" style={{ color: C.text }}>
                Add an Agent
              </AppText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={C.faint} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {agents.map((agent) => {
                const color = getAgentColor(agent.name);
                const alreadyAdded = roomAgents.some((a) => a.id === agent.id);
                return (
                  <TouchableOpacity
                    key={agent.id}
                    onPress={() => !alreadyAdded && handleAddAgent(agent.id)}
                    activeOpacity={alreadyAdded ? 1 : 0.75}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      backgroundColor: alreadyAdded ? C.surfaceHigh : C.surface,
                      borderRadius: 14,
                      padding: 14,
                      marginBottom: 10,
                      borderWidth: 1,
                      borderColor: C.border,
                      opacity: alreadyAdded ? 0.6 : 1,
                    }}
                  >
                    <View
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 20,
                        backgroundColor: `${color}18`,
                        alignItems: 'center',
                        justifyContent: 'center',
                        marginRight: 14,
                      }}
                    >
                      <AppText style={{ color, fontWeight: '700', fontSize: 17 }}>
                        {agent.name[0].toUpperCase()}
                      </AppText>
                    </View>
                    <View style={{ flex: 1 }}>
                      <AppText style={{ fontSize: 15, fontWeight: '500', color: C.text }}>
                        {agent.name}
                      </AppText>
                      <AppText style={{ fontSize: 12, color: C.muted }} numberOfLines={1}>
                        {agent.personality}
                      </AppText>
                    </View>
                    {alreadyAdded ? (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Ionicons name="checkmark-circle" size={16} color={C.primary} />
                        <AppText style={{ fontSize: 12, color: C.muted }}>Added</AppText>
                      </View>
                    ) : (
                      <Ionicons name="add-circle-outline" size={20} color={C.primary} />
                    )}
                  </TouchableOpacity>
                );
              })}
              {agents.length === 0 && (
                <View style={{ alignItems: 'center', paddingVertical: 32 }}>
                  <Ionicons
                    name="people-outline"
                    size={36}
                    color={C.faint}
                    style={{ marginBottom: 12 }}
                  />
                  <AppText style={{ textAlign: 'center', color: C.muted }}>
                    No agents yet. Create one in the Agents tab.
                  </AppText>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
