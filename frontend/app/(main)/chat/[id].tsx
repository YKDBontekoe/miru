import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useTranslation } from 'react-i18next';
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
import { QuickViewAgentSheet } from '../../../src/components/agents/QuickViewAgentSheet';

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
  const { t } = useTranslation();
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
  const [quickViewAgent, setQuickViewAgent] = useState<Agent | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const messageCount = useRef(0);

  const room = React.useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const roomMessages = React.useMemo(() => messages[roomId ?? ''] ?? [], [messages, roomId]);
  const currentActivity = React.useMemo(() => (roomId ? agentActivity[roomId] : null), [agentActivity, roomId]);
  const agentMap = React.useMemo(() => Object.fromEntries(roomAgents.map((a) => [a.id, a])), [roomAgents]);

  const availableAgents = React.useMemo(() => {
    return agents.filter((a) => !roomAgents.some((r) => r.id === a.id));
  }, [agents, roomAgents]);

  // Connect hub and join room when screen mounts
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

        {/* Tappable agent avatars row */}
        {roomAgents.length > 0 && (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {roomAgents.slice(0, 3).map((agent, i) => {
              const color = getAgentColor(agent.name);
              return (
                <TouchableOpacity
                  key={agent.id}
                  onPress={() => setQuickViewAgent(agent)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: `${color}22`,
                    borderWidth: 2,
                    borderColor: C.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginStart: i === 0 ? 0 : -9,
                    zIndex: 3 - i,
                  }}
                  activeOpacity={0.75}
                >
                  <AppText style={{ color, fontSize: 11, fontWeight: '700' }}>
                    {agent.name[0].toUpperCase()}
                  </AppText>
                </TouchableOpacity>
              );
            })}
            {roomAgents.length > 3 && (
              <View
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: C.surfaceHigh,
                  borderWidth: 2,
                  borderColor: C.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginStart: -9,
                  zIndex: 0,
                }}
              >
                <AppText style={{ color: C.muted, fontSize: 10, fontWeight: '700' }}>
                  +{roomAgents.length - 3}
                </AppText>
              </View>
            )}
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
                  {t('chat.start_conversation')}
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

      {/* Manage Agents Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
          <Animated.View
            entering={SlideInUp.springify().damping(22)}
            exiting={SlideOutDown.duration(200)}
            className="rounded-t-2xl"
            style={{
              backgroundColor: C.surface,
              maxHeight: '72%',
            }}
          >
            <View style={{ alignItems: 'center', paddingTop: 12, marginBottom: 2 }}>
              <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
            </View>
            <View style={{ paddingHorizontal: 20, paddingVertical: 14 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <AppText style={{ fontSize: 18, fontWeight: '700', color: C.text }}>
                  {t('chat.manage_agents', 'Manage Agents')}
                </AppText>
                <TouchableOpacity
                  onPress={() => setIsModalVisible(false)}
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: 15,
                    backgroundColor: C.surfaceHigh,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Ionicons name="close" size={16} color={C.muted} />
                </TouchableOpacity>
              </View>
              {roomAgents.length > 0 && (
                <AppText style={{ color: C.muted, fontSize: 12, marginTop: 3 }}>
                  {roomAgents.length} active · tap an avatar in the header to manage
                </AppText>
              )}
            </View>

            <ScrollView style={{ paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
              {/* In Room section */}
              {roomAgents.length > 0 && (
                <FlatList
                  data={roomAgents}
                  keyExtractor={(item) => `in-${item.id}`}
                  scrollEnabled={false}
                  ListHeaderComponent={
                    <AppText
                      style={{
                        color: C.muted,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        marginBottom: 8,
                      }}
                    >
                      In this chat
                    </AppText>
                  }
                  renderItem={({ item: agent }) => {
                    const color = getAgentColor(agent.name);
                    return (
                      <View
                        style={{
                          flexDirection: 'row',
                          alignItems: 'center',
                          backgroundColor: `${color}08`,
                          borderRadius: 14,
                          padding: 12,
                          marginBottom: 8,
                          borderWidth: 1,
                          borderColor: `${color}25`,
                        }}
                      >
                        <View
                          style={{
                            width: 38,
                            height: 38,
                            borderRadius: 19,
                            backgroundColor: `${color}18`,
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginEnd: 12,
                          }}
                        >
                          <AppText style={{ color, fontWeight: '700', fontSize: 15 }}>
                            {agent.name[0].toUpperCase()}
                          </AppText>
                        </View>
                        <View style={{ flex: 1 }}>
                          <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                            {agent.name}
                          </AppText>
                          <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
                            {agent.personality}
                          </AppText>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleRemoveAgent(agent.id)}
                          style={{
                            backgroundColor: '#FEE2E2',
                            borderRadius: 8,
                            paddingHorizontal: 10,
                            paddingVertical: 5,
                            flexDirection: 'row',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <Ionicons name="remove" size={13} color="#EF4444" />
                          <AppText style={{ color: '#EF4444', fontSize: 12, fontWeight: '600' }}>
                            Remove
                          </AppText>
                        </TouchableOpacity>
                      </View>
                    );
                  }}
                />
              )}

              <FlatList
                data={availableAgents}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                ListHeaderComponent={
                  availableAgents.length > 0 && roomAgents.length > 0 ? (
                    <AppText
                      style={{
                        color: C.muted,
                        fontSize: 11,
                        fontWeight: '700',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                        marginBottom: 8,
                        marginTop: 8,
                      }}
                    >
                      Add more
                    </AppText>
                  ) : null
                }
                ListEmptyComponent={
                  agents.length === 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                      <Ionicons
                        name="people-outline"
                        size={36}
                        color={C.faint}
                        style={{ marginBottom: 12 }}
                      />
                      <AppText style={{ textAlign: 'center', color: C.muted }}>
                        {t('chat.no_agents_create')}
                      </AppText>
                    </View>
                  ) : availableAgents.length === 0 && agents.length > 0 ? (
                    <View style={{ alignItems: 'center', paddingVertical: 36 }}>
                      <Ionicons
                        name="people-outline"
                        size={36}
                        color={C.faint}
                        style={{ marginBottom: 12 }}
                      />
                      <AppText style={{ textAlign: 'center', color: C.muted }}>
                        {t('chat.no_more_agents_to_add', 'No more agents to add.')}
                      </AppText>
                    </View>
                  ) : null
                }
                renderItem={({ item: agent }) => {
                  const color = getAgentColor(agent.name);
                  return (
                    <View
                      style={{
                        flexDirection: 'row',
                        alignItems: 'center',
                        backgroundColor: C.surface,
                        borderRadius: 14,
                        padding: 12,
                        marginBottom: 8,
                        borderWidth: 1,
                        borderColor: C.border,
                      }}
                    >
                      <View
                        style={{
                          width: 38,
                          height: 38,
                          borderRadius: 19,
                          backgroundColor: `${color}18`,
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginEnd: 12,
                        }}
                      >
                        <AppText style={{ color, fontWeight: '700', fontSize: 15 }}>
                          {agent.name[0].toUpperCase()}
                        </AppText>
                      </View>
                      <View style={{ flex: 1 }}>
                        <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                          {agent.name}
                        </AppText>
                        <AppText style={{ fontSize: 11, color: C.muted }} numberOfLines={1}>
                          {agent.personality}
                        </AppText>
                      </View>
                      <TouchableOpacity
                        onPress={() => handleAddAgent(agent.id)}
                        style={{
                          backgroundColor: C.primarySurface,
                          borderRadius: 8,
                          paddingHorizontal: 10,
                          paddingVertical: 5,
                          flexDirection: 'row',
                          alignItems: 'center',
                          gap: 4,
                        }}
                      >
                        <Ionicons name="add" size={13} color={C.primary} />
                        <AppText style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>
                          Add
                        </AppText>
                      </TouchableOpacity>
                    </View>
                  );
                }}
              />
              <View style={{ height: 40 }} />
            </ScrollView>
          </Animated.View>
        </View>
      </Modal>

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
