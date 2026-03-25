import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
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
import { Agent, ChatMessage } from '../../../src/core/models';

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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface,
    gap: 8,
  },
  headerIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: C.primarySurface,
    borderWidth: 1,
    borderColor: `${C.primary}25`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInitial: { color: C.primary, fontWeight: '700', fontSize: 16 },
  headerContent: { flex: 1 },
  headerTitle: { fontSize: 16, fontWeight: '600', color: C.text },
  headerSubtitle: { fontSize: 11, color: C.muted },
  agentAvatarRow: { flexDirection: 'row' },
  agentAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: C.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentAvatarText: { fontSize: 11, fontWeight: '700' },
  addAgentBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loaderContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: C.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: { color: C.text, fontWeight: '600', fontSize: 16, marginBottom: 6 },
  emptySubtitle: { color: C.muted, textAlign: 'center', fontSize: 14 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '70%',
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { color: C.text },
  modalAgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
  },
  modalAgentAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 14,
  },
  modalAgentInitials: { fontWeight: '700', fontSize: 17 },
  modalAgentContent: { flex: 1 },
  modalAgentName: { fontSize: 15, fontWeight: '500', color: C.text },
  modalAgentPersonality: { fontSize: 12, color: C.muted },
  modalAddedContainer: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  modalAddedText: { fontSize: 12, color: C.muted },
  modalEmptyContainer: { alignItems: 'center', paddingVertical: 32 },
  modalEmptyIcon: { marginBottom: 12 },
  modalEmptyText: { textAlign: 'center', color: C.muted },
});

const AgentItem = React.memo(({
  agent,
  alreadyAdded,
  onAdd,
}: {
  agent: Agent;
  alreadyAdded: boolean;
  onAdd: (id: string) => void;
}) => {
  const { t } = useTranslation();
  const color = getAgentColor(agent.name);
  const handleAdd = useCallback(() => !alreadyAdded && onAdd(agent.id), [alreadyAdded, agent.id, onAdd]);

  return (
    <TouchableOpacity
      onPress={handleAdd}
      activeOpacity={alreadyAdded ? 1 : 0.75}
      style={[
        styles.modalAgentItem,
        {
          backgroundColor: alreadyAdded ? C.surfaceHigh : C.surface,
          borderColor: C.border,
          opacity: alreadyAdded ? 0.6 : 1,
        },
      ]}
    >
      <View style={[styles.modalAgentAvatar, { backgroundColor: `${color}18` }]}>
        <AppText style={[styles.modalAgentInitials, { color }]}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <View style={styles.modalAgentContent}>
        <AppText style={styles.modalAgentName}>{agent.name}</AppText>
        <AppText style={styles.modalAgentPersonality} numberOfLines={1}>
          {agent.personality}
        </AppText>
      </View>
      {alreadyAdded ? (
        <View style={styles.modalAddedContainer}>
          <Ionicons name="checkmark-circle" size={16} color={C.primary} />
          <AppText style={styles.modalAddedText}>{t('chat.added')}</AppText>
        </View>
      ) : (
        <Ionicons name="add-circle-outline" size={20} color={C.primary} />
      )}
    </TouchableOpacity>
  );
});

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
  const flatListRef = useRef<FlatList>(null);
  const messageCount = useRef(0);

  const room = useMemo(() => rooms.find((r) => r.id === roomId), [rooms, roomId]);
  const roomMessages = useMemo(() => messages[roomId ?? ''] ?? [], [messages, roomId]);
  const currentActivity = useMemo(() => (roomId ? agentActivity[roomId] : null), [agentActivity, roomId]);
  const agentMap = useMemo(() => Object.fromEntries(roomAgents.map((a) => [a.id, a])), [roomAgents]);

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

  useEffect(() => {
    if (roomMessages.length > messageCount.current) {
      messageCount.current = roomMessages.length;
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 50);
    }
  }, [roomMessages.length]);

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

  const handleAddAgent = useCallback(async (agentId: string) => {
    if (!roomId) return;
    await addAgentToRoom(roomId, agentId);
    const updated = await ApiService.getRoomAgents(roomId);
    setRoomAgents(updated);
    setIsModalVisible(false);
  }, [roomId, addAgentToRoom]);

  const renderMessageItem = useCallback(
    ({ item }: { item: ChatMessage }) => {
      const agent = item.agent_id ? agentMap[item.agent_id] : undefined;
      const isLastUserMsg =
        !item.user_id &&
        item.status === 'error' &&
        roomMessages.findIndex((m) => m.id === item.id) > 0;
      const prevUserMsg = isLastUserMsg
        ? roomMessages
            .slice(0, roomMessages.findIndex((m) => m.id === item.id))
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
    },
    [agentMap, roomMessages, handleRetry]
  );

  const ListEmptyComponent = useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconBox}>
          <Ionicons name="chatbubble-ellipses-outline" size={30} color={C.primary} />
        </View>
        <AppText style={styles.emptyTitle}>{t('chat.start_conversation')}</AppText>
        <AppText style={styles.emptySubtitle}>
          {roomAgents.length > 0
            ? `${roomAgents.map((a) => a.name).join(', ')} ${roomAgents.length === 1 ? 'is' : 'are'} ready to help.`
            : 'Add an agent to get started.'}
        </AppText>
      </View>
    ),
    [roomAgents, t]
  );

  const ListFooterComponent = useMemo(
    () => (currentActivity ? <AgentActivityIndicator activity={currentActivity} /> : null),
    [currentActivity]
  );

  const renderModalAgentItem = useCallback(
    ({ item }: { item: Agent }) => (
      <AgentItem
        agent={item}
        alreadyAdded={roomAgents.some((a) => a.id === item.id)}
        onAdd={handleAddAgent}
      />
    ),
    [roomAgents, handleAddAgent]
  );

  const ModalListEmptyComponent = useMemo(
    () => (
      <View style={styles.modalEmptyContainer}>
        <Ionicons name="people-outline" size={36} color={C.faint} style={styles.modalEmptyIcon} />
        <AppText style={styles.modalEmptyText}>{t('chat.no_agents_create')}</AppText>
      </View>
    ),
    [t]
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name="chevron-back" size={26} color={C.text} />
        </TouchableOpacity>

        <View style={styles.headerIcon}>
          <AppText style={styles.headerInitial}>
            {room?.name[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>

        <View style={styles.headerContent}>
          <AppText style={styles.headerTitle} numberOfLines={1}>
            {room?.name ?? 'Chat'}
          </AppText>
          {roomAgents.length > 0 && (
            <AppText style={styles.headerSubtitle} numberOfLines={1}>
              {roomAgents.map((a) => a.name).join(', ')}
            </AppText>
          )}
        </View>

        {roomAgents.length > 0 && (
          <View style={styles.agentAvatarRow}>
            {roomAgents.slice(0, 3).map((agent, i) => {
              const color = getAgentColor(agent.name);
              return (
                <View
                  key={agent.id}
                  style={[
                    styles.agentAvatar,
                    { backgroundColor: `${color}20`, marginStart: i === 0 ? 0 : -8 },
                  ]}
                >
                  <AppText style={[styles.agentAvatarText, { color }]}>
                    {agent.name[0].toUpperCase()}
                  </AppText>
                </View>
              );
            })}
          </View>
        )}

        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.addAgentBtn}>
          <Ionicons name="person-add-outline" size={16} color={C.primary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0} style={{ flex: 1 }}>
        {isLoadingMessages && roomMessages.length === 0 ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={roomMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={ListEmptyComponent}
            renderItem={renderMessageItem}
            ListFooterComponent={ListFooterComponent}
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

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeaderRow}>
              <AppText variant="h2" style={styles.modalTitle}>
                Add an Agent
              </AppText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <Ionicons name="close-circle" size={26} color={C.faint} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={agents}
              keyExtractor={(item) => item.id}
              renderItem={renderModalAgentItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={ModalListEmptyComponent}
            />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
