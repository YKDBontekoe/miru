import React, { useEffect, useState } from 'react';
import {
  View,
  TouchableOpacity,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
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

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function AgentPill({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  const color = getAgentColor(agent.name);
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
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
    </TouchableOpacity>
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
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.75}
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
    </TouchableOpacity>
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

  const toggleAgent = (id: string) =>
    setSelectedAgentIds((prev) =>
      prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
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
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
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
              <ScrollView style={{ maxHeight: 180 }} showsVerticalScrollIndicator={false}>
                {agents.map((agent) => {
                  const color = getAgentColor(agent.name);
                  const selected = selectedAgentIds.includes(agent.id);
                  return (
                    <TouchableOpacity
                      key={agent.id}
                      onPress={() => toggleAgent(agent.id)}
                      activeOpacity={0.8}
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
                        <AppText style={{ color, fontWeight: '700' }}>
                          {agent.name[0].toUpperCase()}
                        </AppText>
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
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </>
          )}

          <TouchableOpacity
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
        <TouchableOpacity
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
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
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
        contentContainerStyle={{ paddingBottom: 24 }}
      >
        {/* Agents row */}
        {agents.length > 0 && (
          <View style={{ marginBottom: 8 }}>
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
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 4 }}
            >
              {agents.map((agent) => (
                <AgentPill
                  key={agent.id}
                  agent={agent}
                  onPress={() => router.push('/(main)/agents')}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {agents.length > 0 && (
          <View
            style={{
              height: 1,
              backgroundColor: C.borderLight,
              marginHorizontal: 20,
              marginBottom: 20,
            }}
          />
        )}

        {/* Chats */}
        <View style={{ paddingHorizontal: 20 }}>
          <AppText
            variant="caption"
            color="muted"
            className="uppercase tracking-widest font-bold mb-3.5"
          >
            {t('chat.chats', 'Chats')}
          </AppText>

          {rooms.length === 0 && !isLoadingRooms ? (
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
              <TouchableOpacity
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
              </TouchableOpacity>
            </View>
          ) : (
            rooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                agents={roomAgents[room.id] ?? []}
                onPress={() => router.push(`/(main)/chat/${room.id}`)}
              />
            ))
          )}
        </View>
      </ScrollView>

      <CreateRoomModal
        visible={showCreateModal}
        agents={agents}
        onClose={() => setShowCreateModal(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}
