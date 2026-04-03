import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ChatBubble } from '@/components/ChatBubble';
import { ChatInputBar } from '@/components/ChatInputBar';
import { AgentActivityIndicator } from '@/components/AgentActivityIndicator';
import { useChatStore } from '@/store/useChatStore';
import { useAgentStore } from '@/store/useAgentStore';
import { ApiService } from '@/core/api/ApiService';
import { Agent } from '@/core/models';
import { QuickViewAgentSheet } from '@/components/agents/QuickViewAgentSheet';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { ManageAgentsModal } from '@/components/chat/ManageAgentsModal';
import { ChatRoomEmptyState } from '@/components/chat/ChatRoomEmptyState';
import { useChatRoomSetup } from '@/hooks/useChatRoomSetup';
import { getAgentColor } from '@/utils/chatUtils';
import { SecureLocalStorage } from '@/core/services/storage';

const C = {
  bg: '#F8F8FC',
  primary: '#2563EB',
  primarySoft: '#EFF6FF',
  text: '#0F3D31',
};

interface RoomShortcut {
  text: string;
  pinned: boolean;
}

export default function ChatRoomScreen() {
  const { t } = useTranslation();
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
  const [shortcuts, setShortcuts] = useState<RoomShortcut[]>([]);

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
      Alert.alert(t('chat.error'), t('chat.remove_agent_failed'));
    }
  };

  const defaultQuickActions = React.useMemo(
    () => [
      t('chat.quick_actions.plan_day', {
        defaultValue: 'Plan my day from my open tasks and events.',
      }),
      t('chat.quick_actions.extract_actions', {
        defaultValue: 'Extract action items from this chat.',
      }),
      t('chat.quick_actions.schedule_week', {
        defaultValue: 'Schedule my most important task this week.',
      }),
      t('chat.quick_actions.top_priorities', {
        defaultValue: 'What are my top 3 priorities today?',
      }),
    ],
    [t]
  );

  useEffect(() => {
    if (!roomId) return;
    const key = `miru:room-shortcuts:${roomId}`;
    let mounted = true;
    const loadShortcuts = async () => {
      try {
        const rawResult = SecureLocalStorage.getItem(key);
        const raw =
          typeof rawResult === 'string' || rawResult === null ? rawResult : await rawResult;
        if (!raw) {
          if (mounted) {
            setShortcuts(defaultQuickActions.map((text) => ({ text, pinned: false })));
          }
          return;
        }
        try {
          const parsed = JSON.parse(raw) as RoomShortcut[];
          const withDefaults = [...parsed];
          defaultQuickActions.forEach((text) => {
            if (!withDefaults.some((entry) => entry.text === text)) {
              withDefaults.push({ text, pinned: false });
            }
          });
          if (mounted) {
            setShortcuts(withDefaults);
          }
        } catch {
          if (mounted) {
            setShortcuts(defaultQuickActions.map((text) => ({ text, pinned: false })));
          }
        }
      } catch {
        if (mounted) {
          setShortcuts(defaultQuickActions.map((text) => ({ text, pinned: false })));
        }
      }
    };
    loadShortcuts();
    return () => {
      mounted = false;
    };
  }, [roomId, defaultQuickActions]);

  const persistShortcuts = useCallback(
    async (next: RoomShortcut[]) => {
      if (!roomId) return;
      const key = `miru:room-shortcuts:${roomId}`;
      await SecureLocalStorage.setItem(key, JSON.stringify(next));
    },
    [roomId]
  );

  const quickActions = React.useMemo(
    () => [...shortcuts].sort((a, b) => Number(b.pinned) - Number(a.pinned)),
    [shortcuts]
  );

  const handleQuickAction = useCallback(
    (prompt: string) => {
      if (!roomId || isStreaming) return;
      setInputText('');
      sendMessage(roomId, prompt);
    },
    [isStreaming, roomId, sendMessage]
  );

  const togglePinnedShortcut = useCallback(
    (text: string) => {
      setShortcuts((prev) => {
        const next = prev.map((entry) =>
          entry.text === text ? { ...entry, pinned: !entry.pinned } : entry
        );
        persistShortcuts(next).catch(() => {});
        return next;
      });
    },
    [persistShortcuts]
  );

  const saveInputAsShortcut = useCallback(() => {
    const normalized = inputText.trim();
    if (!normalized) return;
    setShortcuts((prev) => {
      if (prev.some((entry) => entry.text.toLowerCase() === normalized.toLowerCase())) {
        return prev;
      }
      const next = [{ text: normalized, pinned: true }, ...prev].slice(0, 12);
      persistShortcuts(next).catch(() => {});
      return next;
    });
  }, [inputText, persistShortcuts]);

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top', 'left', 'right']}>
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
        className="flex-1"
      >
        {/* Message list */}
        {isLoadingMessages && roomMessages.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color={C.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={roomMessages}
            keyExtractor={(item) => item.id}
            contentContainerClassName="px-4 pt-4 pb-2 grow"
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

        <View className="px-4 pb-2">
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <Pressable
              onPress={saveInputAsShortcut}
              className="mr-2 rounded-full px-3 py-2"
              style={{ backgroundColor: C.primarySoft }}
              disabled={isStreaming || !inputText.trim()}
            >
              <AppText className="text-xs font-semibold" style={{ color: C.primary }}>
                Save prompt
              </AppText>
            </Pressable>
            {quickActions.map((action) => (
              <Pressable
                key={action.text}
                onPress={() => handleQuickAction(action.text)}
                onLongPress={() => togglePinnedShortcut(action.text)}
                className="mr-2 rounded-full bg-primaryFaint px-3 py-2"
                disabled={isStreaming}
              >
                <AppText className="text-xs font-semibold text-primary">
                  {action.pinned ? '★ ' : ''}
                  {action.text}
                </AppText>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isStreaming={isStreaming}
          onStop={stopStreaming}
          placeholder={
            roomAgents.length > 0
              ? t('chat.message_placeholder', { name: roomAgents[0].name })
              : t('chat.message_default_placeholder', { defaultValue: 'Message...' })
          }
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
