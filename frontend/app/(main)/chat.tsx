import React, { useEffect, useState } from 'react';
import {
  View,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { useChatStore } from '../../src/store/useChatStore';
import { ApiService } from '../../src/core/api/ApiService';
import { useAgentStore } from '../../src/store/useAgentStore';
import { ChatRoom, Agent } from '../../src/core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { SkeletonAgentCard } from '@/components/SkeletonCard';

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

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function AgentPill({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  const color = getAgentColor(agent.name);
  return (
    <ScalePressable
      onPress={onPress}
      style={{ width: 72, alignItems: 'center', marginEnd: 12 }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: 26,
          backgroundColor: `${color}18`,
          borderWidth: 1.5,
          borderColor: `${color}40`,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 6,
        }}
      >
        <AppText style={{ color, fontSize: 20, fontWeight: '700' }}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <AppText
        variant="caption"
        numberOfLines={1}
        style={{ textAlign: 'center', fontSize: 11, color: C.muted }}
      >
        {agent.name}
      </AppText>
    </ScalePressable>
  );
}

function RoomCard({
  room,
  agents,
  onPress,
}: {
  room: ChatRoom;
  agents: Agent[];
  onPress: () => void;
}) {
  const { t } = useTranslation();
  const initial = room.name[0]?.toUpperCase() ?? '?';
  const memberLabel = () => {
    if (agents.length === 0) return t('chat.no_agents_yet', 'No agents yet');
    if (agents.length === 1) return `You + ${agents[0].name}`;
    if (agents.length === 2) return `You, ${agents[0].name} & ${agents[1].name}`;
    return `You + ${agents.length} agents`;
  };

  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.surface,
        borderRadius: 16,
        padding: 14,
        marginBottom: 10,
        borderWidth: 1,
        borderColor: C.border,
      }}
    >
      <View
        style={{
          width: 48,
          height: 48,
          borderRadius: 14,
          backgroundColor: C.primarySurface,
          alignItems: 'center',
          justifyContent: 'center',
          marginEnd: 14,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 20, fontWeight: '700' }}>{initial}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={{ fontSize: 15, fontWeight: '600', color: C.text, marginBottom: 3 }}>
          {room.name}
        </AppText>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons name="people-outline" size={12} color={C.muted} style={{ marginEnd: 4 }} />
          <AppText variant="caption" style={{ fontSize: 12, color: C.muted }}>
            {memberLabel()}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={C.faint} />
    </ScalePressable>
  );
}

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

  const toggleAgent = React.useCallback(
    (id: string) =>
      setSelectedAgentIds((prev) =>
        prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
      ),
    []
  );

  const renderAgentItem = React.useCallback(
    ({ item: agent }: { item: Agent }) => {
      const color = getAgentColor(agent.name);
      const selected = selectedAgentIds.includes(agent.id);
      return (
        <ScalePressable
          onPress={() => toggleAgent(agent.id)}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: selected ? `${color}10` : C.surfaceHigh,
            borderRadius: 12,
            padding: 12,
            marginBottom: 8,
            borderWidth: 1,
            borderColor: selected ? `${color}40` : C.border,
          }}
        >
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 18,
              backgroundColor: `${color}18`,
              alignItems: 'center',
              justifyContent: 'center',
              marginEnd: 12,
            }}
          >
            <AppText style={{ color, fontWeight: '700' }}>{agent.name[0].toUpperCase()}</AppText>
          </View>
          <View style={{ flex: 1 }}>
            <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
              {agent.name}
            </AppText>
            <AppText variant="caption" style={{ color: C.muted }} numberOfLines={1}>
              {agent.personality}
            </AppText>
          </View>
          {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
        </ScalePressable>
      );
    },
    [selectedAgentIds, toggleAgent]
  );

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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            maxHeight: '82%',
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 24,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              New Chat
            </AppText>
            <ScalePressable onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </ScalePressable>
          </View>

          <AppText
            variant="caption"
            style={{
              color: C.muted,
              marginBottom: 8,
              textTransform: 'uppercase',
              letterSpacing: 1,
            }}
          >
            Chat Name
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gaming Session"
            placeholderTextColor={C.faint}
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: C.text,
              fontSize: 16,
              marginBottom: 20,
            }}
          />

          {agents.length > 0 && (
            <>
              <AppText
                variant="caption"
                style={{
                  color: C.muted,
                  marginBottom: 10,
                  textTransform: 'uppercase',
                  letterSpacing: 1,
                }}
              >
                Add Agents
              </AppText>
              <FlatList
                data={agents}
                keyExtractor={(item) => item.id}
                renderItem={renderAgentItem}
                showsVerticalScrollIndicator={false}
                style={{ maxHeight: 180 }}
              />
            </>
          )}

          <ScalePressable
            onPress={handleCreate}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}80` : C.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
              marginTop: 20,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                Create Chat
              </AppText>
            )}
          </ScalePressable>
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
  const [roomAgents, setRoomAgents] = useState<Record<string, Agent[]>>({});

  useEffect(() => {
    fetchRooms();
    fetchAgents();
  }, [fetchRooms, fetchAgents]);

  useEffect(() => {
    if (rooms.length === 0) return;
    let isMounted = true;

    const loadRoomAgents = async () => {
      try {
        const agentPromises = rooms.map(async (room) => {
          const roomAgentsData = await ApiService.getRoomAgents(room.id);
          return { roomId: room.id, agents: roomAgentsData };
        });
        const results = await Promise.all(agentPromises);
        if (!isMounted) return;
        const newRoomAgents: Record<string, Agent[]> = {};
        for (const res of results) {
          newRoomAgents[res.roomId] = res.agents;
        }
        setRoomAgents(newRoomAgents);
      } catch {}
    };

    loadRoomAgents();
    return () => {
      isMounted = false;
    };
  }, [rooms]);

  const renderRoomItem = React.useCallback(
    ({ item: room }: { item: ChatRoom }) => (
      <RoomCard
        room={room}
        agents={roomAgents[room.id] ?? []}
        onPress={() => router.push(`/(main)/chat/${room.id}`)}
      />
    ),
    [roomAgents, router]
  );

  const renderHeaderAgentPill = React.useCallback(
    ({ item }: { item: Agent }) => (
      <AgentPill agent={item} onPress={() => router.push('/(main)/agents')} />
    ),
    [router]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 16,
        }}
      >
        <AppText variant="h1" style={{ fontSize: 28, fontWeight: '700', color: C.text }}>
          {t('chat.title', 'Miru')}
        </AppText>
        <ScalePressable
          onPress={() => setShowCreateModal(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: 18,
            backgroundColor: C.primary,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="add" size={22} color="white" />
        </ScalePressable>
      </View>

      <FlatList
        data={rooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24, paddingHorizontal: 20 }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingRooms}
            onRefresh={() => {
              fetchRooms();
              fetchAgents();
            }}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <>
            {/* Agents row */}
            {agents.length > 0 && (
              <View style={{ marginBottom: 8, marginHorizontal: -20 }}>
                <AppText
                  variant="caption"
                  style={{
                    textTransform: 'uppercase',
                    letterSpacing: 1.2,
                    fontSize: 11,
                    fontWeight: '700',
                    color: C.muted,
                    paddingHorizontal: 20,
                    marginBottom: 14,
                  }}
                >
                  {t('chat.personas', 'Personas')}
                </AppText>
                <FlatList
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
                  data={agents}
                  keyExtractor={(item) => item.id}
                  renderItem={renderHeaderAgentPill}
                />
              </View>
            )}

            {agents.length > 0 && (
              <View
                style={{
                  height: 1,
                  backgroundColor: C.borderLight,
                  marginBottom: 20,
                }}
              />
            )}

            <AppText
              variant="caption"
              color="muted"
              className="uppercase tracking-widest font-bold mb-3.5"
            >
              {t('chat.chats', 'Chats')}
            </AppText>
          </>
        }
        ListEmptyComponent={
          !isLoadingRooms ? (
            <View style={{ alignItems: 'center', paddingVertical: 48 }}>
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 36,
                  backgroundColor: C.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  borderWidth: 1,
                  borderColor: C.border,
                }}
              >
                <Ionicons name="chatbubbles-outline" size={32} color={C.faint} />
              </View>
              <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
                {t('chat.no_conversations_title', 'No conversations yet')}
              </AppText>
              <AppText
                style={{
                  textAlign: 'center',
                  marginBottom: 24,
                  paddingHorizontal: 24,
                  color: C.muted,
                }}
              >
                {t(
                  'chat.no_conversations_desc',
                  'Create a chat and start collaborating with your AI personas.'
                )}
              </AppText>
              <ScalePressable
                onPress={() => setShowCreateModal(true)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingVertical: 12,
                  paddingHorizontal: 24,
                }}
              >
                <Ionicons name="add" size={18} color="white" style={{ marginEnd: 6 }} />
                <AppText style={{ color: 'white', fontWeight: '700' }}>
                  {t('chat.new_chat', 'New Chat')}
                </AppText>
              </ScalePressable>
            </View>
          ) : (
            <View style={{ gap: 12, marginTop: 12 }}>
               <SkeletonAgentCard index={0} />
               <SkeletonAgentCard index={1} />
               <SkeletonAgentCard index={2} />
            </View>
          )
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
