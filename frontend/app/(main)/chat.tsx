import React, { useEffect, useState } from 'react';
import { View, RefreshControl, FlatList, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { useChatStore } from '@/store/useChatStore';
import { ApiService } from '@/core/api/ApiService';
import { useAgentStore } from '@/store/useAgentStore';
import { ChatRoom, Agent } from '@/core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { SkeletonAgentCard } from '@/components/SkeletonCard';
import { AgentPill } from '@/components/chat/AgentPill';
import { RoomCard } from '@/components/chat/RoomCard';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
import { DESIGN_TOKENS } from '@/core/design/tokens';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: DESIGN_TOKENS.colors.pageBg,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

export default function ChatListScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreate = params.openCreate;
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
    if (openCreate === '1' || openCreate === 'true') {
      setShowCreateModal(true);
      const nextParams = Object.fromEntries(
        Object.entries(params).filter(
          ([key, value]) => key !== 'openCreate' && typeof value === 'string'
        )
      );
      router.replace({
        pathname,
        params: nextParams,
      });
    }
  }, [openCreate, params, pathname, router]);

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
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to load room agents', { err, roomCount: rooms.length });
        Alert.alert(t('chat.error'), t('chat.failed_to_load_agents'));
      }
    };

    loadRoomAgents();
    return () => {
      isMounted = false;
    };
  }, [rooms, t]);

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
        contentContainerStyle={{
          paddingBottom: 24 + (Platform.OS === 'ios' ? 32 : 16) + 64,
          paddingHorizontal: 20,
        }}
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

            {agents.length > 0 && <View style={{ marginBottom: 20 }} />}

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
                  borderRadius: 24,
                  backgroundColor: C.surfaceHigh,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
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
