import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  TouchableOpacity,
  RefreshControl,
  FlatList,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useChatStore } from '../../src/store/useChatStore';
import { useAgentStore } from '../../src/store/useAgentStore';
import { ChatRoom, Agent } from '../../src/core/models';

// ─── Light mode palette ───────────────────────────────────────────────────────
const C = {
  bg: '#F8F8FC',
  surface: '#FFFFFF',
  surfaceHigh: '#F0F0F6',
  border: '#E0E0EC',
  borderLight: '#EBEBF5',
  text: '#12121A',
  muted: '#6E6E80',
  faint: '#C0C0D0',
  primary: '#2563EB',
  primarySurface: '#EFF6FF',
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: { fontSize: 28, fontWeight: '700', color: C.text },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  agentsTitle: {
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  agentsListContent: { paddingHorizontal: 20, paddingBottom: 4 },
  separator: {
    height: 1,
    backgroundColor: C.borderLight,
    marginHorizontal: 20,
    marginBottom: 20,
  },
  chatsContainer: { paddingHorizontal: 20, flex: 1 },
  chatsTitle: {
    marginHorizontal: 20,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    fontWeight: '700',
    marginBottom: 14,
    color: C.muted,
  },
  emptyContainer: { alignItems: 'center', paddingVertical: 48 },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: C.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: C.border,
  },
  emptyTitle: { marginBottom: 8, textAlign: 'center', color: C.text },
  emptyDesc: {
    textAlign: 'center',
    marginBottom: 24,
    paddingHorizontal: 24,
    color: C.muted,
  },
  newChatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  newChatButtonText: { color: 'white', fontWeight: '700' },
  agentPillContainer: { width: 72, alignItems: 'center', marginEnd: 12 },
  agentPillAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  agentPillText: { fontSize: 20, fontWeight: '700' },
  agentPillName: { textAlign: 'center', fontSize: 11, color: C.muted },
  roomCardContainer: {
    marginHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: C.border,
  },
  roomCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: C.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 14,
  },
  roomCardInitial: { color: C.primary, fontSize: 20, fontWeight: '700' },
  roomCardContent: { flex: 1 },
  roomCardName: { fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 },
  roomCardMembers: { flexDirection: 'row', alignItems: 'center' },
  roomCardMembersIcon: { marginEnd: 4 },
  roomCardMembersText: { fontSize: 12, color: C.muted },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    maxHeight: '82%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: C.text },
  modalLabel: {
    color: C.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  modalInput: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: C.text,
    fontSize: 16,
    marginBottom: 20,
  },
  modalAgentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
  },
  modalAgentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 12,
  },
  modalAgentInitials: { fontWeight: '700' },
  modalAgentContent: { flex: 1 },
  modalAgentName: { fontSize: 14, fontWeight: '600', color: C.text },
  modalCreateButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  modalCreateButtonText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

const AgentPill = React.memo(
  ({ agent, onPress }: { agent: Agent; onPress: (id: string) => void }) => {
    const color = getAgentColor(agent.name);
    const handlePress = useCallback(() => onPress(agent.id), [agent.id, onPress]);

    return (
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.75}
        style={styles.agentPillContainer}
      >
        <View
          style={[
            styles.agentPillAvatar,
            { backgroundColor: `${color}18`, borderColor: `${color}40` },
          ]}
        >
          <AppText style={[styles.agentPillText, { color }]}>{agent.name[0].toUpperCase()}</AppText>
        </View>
        <AppText variant="caption" numberOfLines={1} style={styles.agentPillName}>
          {agent.name}
        </AppText>
      </TouchableOpacity>
    );
  }
);

const RoomCard = React.memo(
  ({
    room,
    agents,
    onPress,
  }: {
    room: ChatRoom;
    agents: Agent[];
    onPress: (id: string) => void;
  }) => {
    const { t } = useTranslation();
    const initial = room.name[0]?.toUpperCase() ?? '?';

    const memberLabel = useMemo(() => {
      if (agents.length === 0) return t('chat.no_agents_yet', 'No agents yet');
      if (agents.length === 1) return `You + ${agents[0].name}`;
      if (agents.length === 2) return `You, ${agents[0].name} & ${agents[1].name}`;
      return `You + ${agents.length} agents`;
    }, [agents, t]);

    const handlePress = useCallback(() => onPress(room.id), [room.id, onPress]);

    return (
      <TouchableOpacity onPress={handlePress} activeOpacity={0.75} style={styles.roomCardContainer}>
        <View style={styles.roomCardAvatar}>
          <AppText style={styles.roomCardInitial}>{initial}</AppText>
        </View>
        <View style={styles.roomCardContent}>
          <AppText style={styles.roomCardName}>{room.name}</AppText>
          <View style={styles.roomCardMembers}>
            <Ionicons
              name="people-outline"
              size={12}
              color={C.muted}
              style={styles.roomCardMembersIcon}
            />
            <AppText variant="caption" style={styles.roomCardMembersText}>
              {memberLabel}
            </AppText>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={18} color={C.faint} />
      </TouchableOpacity>
    );
  }
);

const ModalAgentItem = React.memo(
  ({
    agent,
    selected,
    onToggle,
  }: {
    agent: Agent;
    selected: boolean;
    onToggle: (id: string) => void;
  }) => {
    const color = getAgentColor(agent.name);
    const handleToggle = useCallback(() => onToggle(agent.id), [agent.id, onToggle]);

    return (
      <TouchableOpacity
        onPress={handleToggle}
        activeOpacity={0.8}
        style={[
          styles.modalAgentItem,
          {
            backgroundColor: selected ? `${color}10` : C.surfaceHigh,
            borderColor: selected ? `${color}40` : C.border,
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
          <AppText variant="caption" style={{ color: C.muted }} numberOfLines={1}>
            {agent.personality}
          </AppText>
        </View>
        {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
      </TouchableOpacity>
    );
  }
);

function CreateRoomModal({
  visible,
  agents,
  onClose,
  onCreated,
}: {
  visible: boolean;
  agents: Agent[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { createRoom, addAgentToRoom } = useChatStore();
  const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

  const toggleAgent = useCallback((id: string) => {
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
    );
  }, []);

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(
        t('chat.name_required', 'Name required'),
        t('chat.please_enter_name', 'Please enter a name for this chat.')
      );
      return;
    }
    setIsSaving(true);
    try {
      const room = await createRoom(name.trim());
      for (const agentId of selectedAgentIds) await addAgentToRoom(room.id, agentId);
      setName('');
      setSelectedAgentIds([]);
      onCreated();
      onClose();
    } catch {
      Alert.alert(
        t('chat.error', 'Error'),
        t('chat.failed_to_create', 'Failed to create chat. Please try again.')
      );
    } finally {
      setIsSaving(false);
    }
  };

  const renderAgentItem = useCallback(
    ({ item }: { item: Agent }) => (
      <ModalAgentItem
        agent={item}
        selected={selectedAgentIds.includes(item.id)}
        onToggle={toggleAgent}
      />
    ),
    [selectedAgentIds, toggleAgent]
  );

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={styles.modalTitle}>
              New Chat
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>

          <AppText variant="caption" style={styles.modalLabel}>
            Chat Name
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gaming Session"
            placeholderTextColor={C.faint}
            style={styles.modalInput}
          />

          {agents.length > 0 && (
            <>
              <AppText variant="caption" style={styles.modalLabel}>
                Add Agents
              </AppText>
              <FlatList
                data={agents}
                keyExtractor={(item) => item.id}
                renderItem={renderAgentItem}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 180 }}
                keyboardShouldPersistTaps="handled"
              />
            </>
          )}

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSaving}
            style={[
              styles.modalCreateButton,
              { backgroundColor: isSaving ? `${C.primary}80` : C.primary },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={styles.modalCreateButtonText}>Create Chat</AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

export default function ChatListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomAgents] = useState<Record<string, Agent[]>>({});

  useEffect(() => {
    fetchRooms();
    fetchAgents();
  }, [fetchRooms, fetchAgents]);

  const onRefresh = useCallback(() => {
    fetchRooms();
    fetchAgents();
  }, [fetchRooms, fetchAgents]);

  const handleAgentPress = useCallback(() => {
    router.push('/(main)/agents');
  }, [router]);

  const renderAgentPill = useCallback(
    ({ item }: { item: Agent }) => <AgentPill agent={item} onPress={handleAgentPress} />,
    [handleAgentPress]
  );

  const handleRoomPress = useCallback(
    (roomId: string) => {
      router.push(`/(main)/chat/${roomId}`);
    },
    [router]
  );

  const renderRoomItem = useCallback(
    ({ item }: { item: ChatRoom }) => (
      <RoomCard room={item} agents={roomAgents[item.id] ?? []} onPress={handleRoomPress} />
    ),
    [roomAgents, handleRoomPress]
  );

  const ListHeaderComponent = useMemo(
    () => (
      <>
        {agents.length > 0 && (
          <View style={{ marginBottom: 8 }}>
            <AppText variant="caption" style={styles.agentsTitle}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <FlatList
              data={agents}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agentsListContent}
              keyExtractor={(item) => item.id}
              renderItem={renderAgentPill}
            />
          </View>
        )}

        {agents.length > 0 && <View style={styles.separator} />}

        <AppText variant="caption" style={styles.chatsTitle}>
          {t('chat.chats', 'Chats')}
        </AppText>
      </>
    ),
    [agents, t, renderAgentPill]
  );

  const ListEmptyComponent = useMemo(() => {
    if (isLoadingRooms) return null;
    return (
      <View style={styles.emptyContainer}>
        <View style={styles.emptyIconContainer}>
          <Ionicons name="chatbubbles-outline" size={32} color={C.faint} />
        </View>
        <AppText variant="h3" style={styles.emptyTitle}>
          {t('chat.no_conversations_title', 'No conversations yet')}
        </AppText>
        <AppText style={styles.emptyDesc}>
          {t(
            'chat.no_conversations_desc',
            'Create a chat and start collaborating with your AI personas.'
          )}
        </AppText>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.newChatButton}>
          <Ionicons name="add" size={18} color="white" style={{ marginEnd: 6 }} />
          <AppText style={styles.newChatButtonText}>{t('chat.new_chat', 'New Chat')}</AppText>
        </TouchableOpacity>
      </View>
    );
  }, [isLoadingRooms, t]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <AppText variant="h1" style={styles.headerTitle}>
          {t('chat.title', 'Miru')}
        </AppText>
        <TouchableOpacity onPress={() => setShowCreateModal(true)} style={styles.addButton}>
          <Ionicons name="add" size={22} color="white" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={
          <RefreshControl refreshing={isLoadingRooms} onRefresh={onRefresh} tintColor={C.primary} />
        }
      />

      <CreateRoomModal
        visible={showCreateModal}
        agents={agents}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}

// --- Auto-added display names ---
AgentPill.displayName = 'AgentPill';
RoomCard.displayName = 'RoomCard';
ModalAgentItem.displayName = 'ModalAgentItem';
