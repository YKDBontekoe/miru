import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import {
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
import { ScalePressable } from '@/components/ScalePressable';
import { useChatStore } from '@/store/useChatStore';
import { useAgentStore } from '@/store/useAgentStore';
import { ApiService } from '@/core/api/ApiService';
import { Agent, ChatMessage } from '@/core/models';
import { QuickViewAgentSheet } from '@/components/agents/QuickViewAgentSheet';
import { ChatRoomHeader } from '@/components/chat/ChatRoomHeader';
import { ManageAgentsModal } from '@/components/chat/ManageAgentsModal';
import { ChatRoomEmptyState } from '@/components/chat/ChatRoomEmptyState';
import { ChatInlineBanner } from '@/components/chat/ChatInlineBanner';
import { RoomPromptRail } from '@/components/chat/RoomPromptRail';
import { useChatRoomSetup } from '@/hooks/useChatRoomSetup';
import { getAgentColor } from '@/utils/chatUtils';
import { SecureLocalStorage } from '@/core/services/storage';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { useProductivityStore } from '@/store/useProductivityStore';

const C = {
  bg: DESIGN_TOKENS.colors.pageBg,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
  text: DESIGN_TOKENS.colors.text,
  border: DESIGN_TOKENS.colors.border,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  destructive: DESIGN_TOKENS.colors.destructive,
};

interface RoomShortcut {
  id: string;
  text: string;
  pinned: boolean;
}

const BUILT_IN_SHORTCUT_IDS = {
  planDay: 'builtin.plan_day',
  extractActions: 'builtin.extract_actions',
  scheduleWeek: 'builtin.schedule_week',
  topPriorities: 'builtin.top_priorities',
} as const;

const LEGACY_TEXT_TO_ID: Record<string, string> = {
  'Plan my day from my open tasks and events.': BUILT_IN_SHORTCUT_IDS.planDay,
  'Extract action items from this chat.': BUILT_IN_SHORTCUT_IDS.extractActions,
  'Schedule my most important task this week.': BUILT_IN_SHORTCUT_IDS.scheduleWeek,
  'What are my top 3 priorities today?': BUILT_IN_SHORTCUT_IDS.topPriorities,
};

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
    hubError,
  } = useChatStore();
  const { tasks, events, fetchTasks, fetchEvents, createTask, createNote } = useProductivityStore();

  const { agents } = useAgentStore();
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [quickViewAgent, setQuickViewAgent] = useState<Agent | null>(null);
  const [shortcuts, setShortcuts] = useState<RoomShortcut[]>([]);
  const [editingShortcutId, setEditingShortcutId] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ text: string; tone: 'error' | 'success' | 'info' } | null>(
    null
  );

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

  useEffect(() => {
    const controller = new AbortController();
    if (tasks.length === 0) fetchTasks(controller.signal);
    if (events.length === 0) fetchEvents(controller.signal);
    return () => controller.abort();
  }, [events.length, fetchEvents, fetchTasks, tasks.length]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(null), 3500);
    return () => clearTimeout(timer);
  }, [notice]);

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
    const normalizedInput = inputText.trim();
    const slashMap: Record<string, string> = {
      '/plan': t('chat.quick_actions.plan_day', {
        defaultValue: 'Plan my day from my open tasks and events.',
      }),
      '/summarize': t('chat.quick_actions.extract_actions', {
        defaultValue: 'Extract action items from this chat.',
      }),
      '/tasks': t('chat.quick_actions.extract_actions', {
        defaultValue: 'Extract action items from this chat.',
      }),
      '/priorities': t('chat.quick_actions.top_priorities', {
        defaultValue: 'What are my top 3 priorities today?',
      }),
    };
    const maybeSlash = normalizedInput.split(' ')[0].toLowerCase();
    const text = slashMap[maybeSlash] ?? normalizedInput;
    setInputText('');
    setEditingShortcutId(null);
    sendMessage(roomId, text);
  }, [inputText, isStreaming, roomId, sendMessage, t]);

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

  const defaultQuickActions = React.useMemo<RoomShortcut[]>(
    () => [
      {
        id: BUILT_IN_SHORTCUT_IDS.planDay,
        text: t('chat.quick_actions.plan_day', {
          defaultValue: 'Plan my day from my open tasks and events.',
        }),
        pinned: false,
      },
      {
        id: BUILT_IN_SHORTCUT_IDS.extractActions,
        text: t('chat.quick_actions.extract_actions', {
          defaultValue: 'Extract action items from this chat.',
        }),
        pinned: false,
      },
      {
        id: BUILT_IN_SHORTCUT_IDS.scheduleWeek,
        text: t('chat.quick_actions.schedule_week', {
          defaultValue: 'Schedule my most important task this week.',
        }),
        pinned: false,
      },
      {
        id: BUILT_IN_SHORTCUT_IDS.topPriorities,
        text: t('chat.quick_actions.top_priorities', {
          defaultValue: 'What are my top 3 priorities today?',
        }),
        pinned: false,
      },
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
            setShortcuts(defaultQuickActions);
          }
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Partial<RoomShortcut>[];
          const normalizedParsed = parsed
            .map((entry, index) => {
              const entryText = typeof entry.text === 'string' ? entry.text : '';
              const existingBuiltIn = defaultQuickActions.find((builtin) => builtin.text === entry.text);
              const legacyBuiltInId = LEGACY_TEXT_TO_ID[entryText];
              return {
                id:
                  typeof entry.id === 'string' && entry.id.length > 0
                    ? entry.id
                    : legacyBuiltInId ?? existingBuiltIn?.id ?? `custom.legacy.${index}`,
                text: entryText,
                pinned: Boolean(entry.pinned),
              };
            })
            .filter((entry) => entry.text.length > 0);
          const mergedById = new Map(normalizedParsed.map((entry) => [entry.id, entry]));
          defaultQuickActions.forEach((entry) => {
            const existing = mergedById.get(entry.id);
            mergedById.set(entry.id, {
              id: entry.id,
              text: entry.text,
              pinned: existing?.pinned ?? false,
            });
          });
          const withDefaults = Array.from(mergedById.values());
          if (mounted) {
            setShortcuts(withDefaults);
          }
        } catch {
          if (mounted) {
            setShortcuts(defaultQuickActions);
          }
        }
      } catch {
        if (mounted) {
          setShortcuts(defaultQuickActions);
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
      setEditingShortcutId(null);
      sendMessage(roomId, prompt);
    },
    [isStreaming, roomId, sendMessage]
  );

  const togglePinnedShortcut = useCallback(
    (id: string) => {
      setShortcuts((prev) => {
        const next = prev.map((entry) =>
          entry.id === id ? { ...entry, pinned: !entry.pinned } : entry
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
      if (
        editingShortcutId === null &&
        prev.some((entry) => entry.text.toLowerCase() === normalized.toLowerCase())
      ) {
        return prev;
      }
      const next =
        editingShortcutId !== null
          ? prev.map((entry) =>
              entry.id === editingShortcutId ? { ...entry, text: normalized } : entry
            )
          : [{ id: `custom.${Date.now()}`, text: normalized, pinned: true }, ...prev].slice(0, 12);
      persistShortcuts(next).catch(() => {});
      return next;
    });
    setEditingShortcutId(null);
    setNotice({
      text:
        editingShortcutId !== null
          ? t('chat.prompt_updated', { defaultValue: 'Prompt updated.' })
          : t('chat.prompt_saved', { defaultValue: 'Prompt saved.' }),
      tone: 'success',
    });
  }, [editingShortcutId, inputText, persistShortcuts, t]);

  const manageShortcut = useCallback(
    (shortcut: RoomShortcut) => {
      Alert.alert(
        t('chat.manage_prompt', { defaultValue: 'Manage prompt' }),
        shortcut.text,
        [
          {
            text: shortcut.pinned
              ? t('chat.unpin', { defaultValue: 'Unpin' })
              : t('chat.pin', { defaultValue: 'Pin' }),
            onPress: () => togglePinnedShortcut(shortcut.id),
          },
          {
            text: t('chat.edit', { defaultValue: 'Edit' }),
            onPress: () => {
              setInputText(shortcut.text);
              setEditingShortcutId(shortcut.id);
            },
          },
          {
            text: t('chat.move_to_top', { defaultValue: 'Move to top' }),
            onPress: () => {
              setShortcuts((prev) => {
                const selected = prev.find((item) => item.id === shortcut.id);
                if (!selected) return prev;
                const next = [selected, ...prev.filter((item) => item.id !== shortcut.id)];
                persistShortcuts(next).catch(() => {});
                return next;
              });
            },
          },
          {
            text: t('chat.delete_prompt', { defaultValue: 'Delete' }),
            style: 'destructive',
            onPress: () => {
              setShortcuts((prev) => {
                const next = prev.filter((entry) => entry.id !== shortcut.id);
                persistShortcuts(next).catch(() => {});
                return next;
              });
            },
          },
          { text: t('common.close', { defaultValue: 'Close' }), style: 'cancel' },
        ]
      );
    },
    [persistShortcuts, t, togglePinnedShortcut]
  );

  const handleMessageLongPress = useCallback(
    (message: ChatMessage) => {
      const content = message.content.trim();
      if (!content) return;

      Alert.alert(
        t('chat.message_actions', { defaultValue: 'Message actions' }),
        content.slice(0, 160),
        [
          {
            text: t('chat.ask_follow_up', { defaultValue: 'Ask follow-up' }),
            onPress: () => {
              setInputText(`${t('chat.follow_up_prefix', { defaultValue: 'Follow up:' })} ${content}`);
            },
          },
          {
            text: t('chat.edit_resend', { defaultValue: 'Edit and resend' }),
            onPress: () => {
              setInputText(content);
            },
          },
          {
            text: t('chat.save_as_note', { defaultValue: 'Save as note' }),
            onPress: async () => {
              try {
                await createNote(
                  t('chat.note_title_default', { defaultValue: 'Chat note' }),
                  content
                );
                setNotice({
                  text: t('chat.note_saved', { defaultValue: 'Saved to notes.' }),
                  tone: 'success',
                });
              } catch {
                setNotice({
                  text: t('chat.note_save_failed', { defaultValue: 'Failed to save note.' }),
                  tone: 'error',
                });
              }
            },
          },
          {
            text: t('chat.create_task', { defaultValue: 'Create task' }),
            onPress: async () => {
              try {
                await createTask(content.slice(0, 120));
                setNotice({
                  text: t('chat.task_created', { defaultValue: 'Task created.' }),
                  tone: 'success',
                });
              } catch {
                setNotice({
                  text: t('chat.task_create_failed', { defaultValue: 'Failed to create task.' }),
                  tone: 'error',
                });
              }
            },
          },
          {
            text: t('chat.use_as_prompt', { defaultValue: 'Use as prompt' }),
            onPress: () => {
              setInputText(content);
              setNotice({
                text: t('chat.copied_to_input', { defaultValue: 'Copied to input.' }),
                tone: 'info',
              });
            },
          },
          { text: t('common.close', { defaultValue: 'Close' }), style: 'cancel' },
        ]
      );
    },
    [createNote, createTask, t]
  );

  const suggestedStarters = useMemo(() => {
    const pendingTask = tasks.find((task) => !task.completed);
    const upcomingEvent = events
      .filter((event) => new Date(event.end_time).getTime() >= Date.now())
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0];
    const starters: string[] = [];
    if (pendingTask) {
      starters.push(
        t('chat.starter_task', {
          defaultValue: 'Help me break down "{{title}}" into next actions.',
          title: pendingTask.title,
        })
      );
    }
    if (upcomingEvent) {
      starters.push(
        t('chat.starter_event', {
          defaultValue: 'Prepare me for "{{title}}" and suggest an agenda.',
          title: upcomingEvent.title,
        })
      );
    }
    starters.push(
      t('chat.quick_actions.plan_day', {
        defaultValue: 'Plan my day from my open tasks and events.',
      })
    );
    return starters.slice(0, 3);
  }, [events, t, tasks]);

  const contextActions = useMemo(() => {
    const topTasks = tasks
      .filter((task) => !task.completed)
      .slice(0, 2)
      .map((task) => `Task: ${task.title}`);
    const topEvents = events
      .filter((event) => new Date(event.end_time).getTime() >= Date.now())
      .slice(0, 1)
      .map((event) => `Event: ${event.title}`);
    return [...topTasks, ...topEvents];
  }, [events, tasks]);

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
        className="flex-1"
      >
        {hubError ? <ChatInlineBanner text={hubError} tone="error" /> : null}
        {notice ? <ChatInlineBanner text={notice.text} tone={notice.tone} /> : null}
        {(isStreaming || currentActivity) && (
          <View
            style={{
              marginHorizontal: 12,
              marginBottom: 8,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: `${C.primary}30`,
              backgroundColor: `${C.primary}12`,
              paddingHorizontal: 10,
              paddingVertical: 8,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <AppText variant="caption" style={{ color: C.primary, fontWeight: '700' }}>
              {currentActivity
                ? `${currentActivity.agent_names?.join(', ') || 'Agent'} · ${currentActivity.activity}`
                : t('chat.streaming', { defaultValue: 'Generating response...' })}
            </AppText>
            <ScalePressable onPress={stopStreaming} accessibilityRole="button">
              <AppText variant="caption" style={{ color: C.primary, fontWeight: '700' }}>
                {t('chat.stop', { defaultValue: 'Stop' })}
              </AppText>
            </ScalePressable>
          </View>
        )}

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
            contentContainerStyle={{
              paddingHorizontal: 14,
              paddingTop: 14,
              paddingBottom: 6,
              flexGrow: 1,
            }}
            keyboardShouldPersistTaps="handled"
            ListEmptyComponent={
              <ChatRoomEmptyState
                roomAgents={roomAgents}
                suggestions={suggestedStarters}
                onSuggestionPress={handleQuickAction}
              />
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
                <Pressable onLongPress={() => handleMessageLongPress(item)}>
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
                </Pressable>
              );
            }}
            ListFooterComponent={
              currentActivity ? <AgentActivityIndicator activity={currentActivity} /> : null
            }
          />
        )}

        <RoomPromptRail
          prompts={quickActions}
          isStreaming={isStreaming}
          saveLabel={
            editingShortcutId
              ? t('chat.update_prompt', { defaultValue: 'Update prompt' })
              : t('chat.save_prompt')
          }
          heading={t('chat.quick_actions_label', { defaultValue: 'Quick prompts' })}
          isEditing={editingShortcutId !== null}
          canSave={Boolean(inputText.trim())}
          onSave={saveInputAsShortcut}
          onPromptPress={handleQuickAction}
          onPromptLongPress={manageShortcut}
          contextActions={contextActions}
          onContextPress={(value) => {
            setInputText((prev) => (prev ? `${prev}\n${value}` : value));
          }}
        />

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
