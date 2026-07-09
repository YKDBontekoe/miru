import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Platform,
  RefreshControl,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { SkeletonAgentCard } from '@/components/SkeletonCard';
import { ChatInlineBanner } from '@/components/chat/ChatInlineBanner';
import { ChatListHeader } from '@/components/chat/ChatListHeader';
import { CreateRoomModal } from '@/components/chat/CreateRoomModal';
import { RoomCard } from '@/components/chat/RoomCard';
import { ApiService } from '@/core/api/ApiService';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { SecureLocalStorage } from '@/core/services/storage';
import { ChatRoom } from '@/core/models';
import { useDebounce } from '@/hooks/useDebounce';
import { useAgentStore } from '@/store/useAgentStore';
import { useChatStore } from '@/store/useChatStore';

const C = {
  bg: DESIGN_TOKENS.colors.pageBg,
  surface: DESIGN_TOKENS.colors.surface,
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  deep: DESIGN_TOKENS.colors.deep,
  border: DESIGN_TOKENS.colors.border,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  faint: DESIGN_TOKENS.colors.faint,
  primary: DESIGN_TOKENS.colors.primary,
  primarySurface: DESIGN_TOKENS.colors.primarySoft,
};

type SortMode = 'recent' | 'mentions' | 'tasks';

interface RoomMeta {
  agents: { id: string; name: string }[];
  lastMessage: string;
  lastMessageAt: string;
  hasMention: boolean;
  hasTask: boolean;
  version: string;
}

const PINNED_ROOMS_KEY = 'miru:chat:pinned-rooms';
const LAST_SEEN_ROOMS_KEY = 'miru:chat:last-seen-rooms';

function parseStoredArray(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((item): item is string => typeof item === 'string');
  } catch {
    return [];
  }
}

function parseStoredMap(raw: string | null): Record<string, string> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return {};
    return Object.fromEntries(
      Object.entries(parsed).filter(
        (entry): entry is [string, string] =>
          typeof entry[0] === 'string' && typeof entry[1] === 'string'
      )
    );
  } catch {
    return {};
  }
}

function toEpoch(value: string | undefined): number {
  if (!value) return 0;
  const ts = new Date(value).getTime();
  return Number.isNaN(ts) ? 0 : ts;
}

function previewText(content: string): string {
  const normalized = content.replace(/\s+/g, ' ').trim();
  return normalized.length > 110 ? `${normalized.slice(0, 110)}...` : normalized;
}

export default function ChatListScreen() {
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreate = params.openCreate;
  const { t } = useTranslation();
  const translate = useCallback(
    (key: string, opts?: Record<string, unknown> | string) => String(t(key, opts as never)),
    [t]
  );
  const router = useRouter();
  const { rooms, fetchRooms, isLoadingRooms, hubError } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomMeta, setRoomMeta] = useState<Record<string, RoomMeta>>({});
  const [metaError, setMetaError] = useState<string | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);

  const [query, setQuery] = useState('');
  const debouncedQuery = useDebounce(query, 100);
  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('recent');
  const [recentOnly, setRecentOnly] = useState(false);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [pinnedRoomIds, setPinnedRoomIds] = useState<string[]>([]);
  const [lastSeenByRoom, setLastSeenByRoom] = useState<Record<string, string>>({});

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
      router.replace({ pathname, params: nextParams });
    }
  }, [openCreate, params, pathname, router]);

  useEffect(() => {
    let mounted = true;
    const loadStored = async () => {
      const [pinnedRaw, seenRaw] = await Promise.all([
        SecureLocalStorage.getItem(PINNED_ROOMS_KEY),
        SecureLocalStorage.getItem(LAST_SEEN_ROOMS_KEY),
      ]);
      if (!mounted) return;
      const pinnedValue =
        typeof pinnedRaw === 'string' || pinnedRaw === null ? pinnedRaw : await pinnedRaw;
      const seenValue = typeof seenRaw === 'string' || seenRaw === null ? seenRaw : await seenRaw;
      if (!mounted) return;
      setPinnedRoomIds(parseStoredArray(pinnedValue));
      setLastSeenByRoom(parseStoredMap(seenValue));
    };
    loadStored();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (rooms.length === 0) return;
    let cancelled = false;

    const loadMeta = async () => {
      setLoadingMeta(true);
      try {
        const nextMeta: Record<string, RoomMeta> = {};
        const roomIds = new Set(rooms.map((room) => room.id));
        let beforeId: string | undefined;

        while (true) {
          const summaries = await ApiService.getRoomSummaries(100, beforeId);
          if (summaries.length === 0) break;

          summaries.forEach((summary) => {
            if (!roomIds.has(summary.id)) return;
            nextMeta[summary.id] = {
              agents: summary.agents,
              lastMessage: previewText(summary.last_message ?? ''),
              lastMessageAt: summary.last_message_at ?? summary.updated_at,
              hasMention: summary.has_mention,
              hasTask: summary.has_task,
              version: summary.updated_at,
            };
          });

          if (summaries.length < 100) break;
          beforeId = summaries[summaries.length - 1]?.id;
          if (!beforeId) break;
        }

        if (cancelled) return;
        setRoomMeta(nextMeta);
        setMetaError(null);
      } catch {
        if (cancelled) return;
        setMetaError(
          t(
            'chat.partial_metadata_error',
            'Some chat details could not be loaded. Pull to refresh to retry.'
          )
        );
      } finally {
        if (!cancelled) {
          setLoadingMeta(false);
        }
      }
    };

    loadMeta();
    return () => {
      cancelled = true;
    };
  }, [rooms, t]);

  const persistPinned = useCallback((next: string[]) => {
    SecureLocalStorage.setItem(PINNED_ROOMS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const persistLastSeen = useCallback((next: Record<string, string>) => {
    SecureLocalStorage.setItem(LAST_SEEN_ROOMS_KEY, JSON.stringify(next)).catch(() => {});
  }, []);

  const togglePinnedRoom = useCallback(
    (roomId: string) => {
      setPinnedRoomIds((prev) => {
        const next = prev.includes(roomId) ? prev.filter((id) => id !== roomId) : [roomId, ...prev];
        persistPinned(next);
        return next;
      });
    },
    [persistPinned]
  );

  const markRoomAsSeen = useCallback(
    (roomId: string) => {
      setLastSeenByRoom((prev) => {
        const next = { ...prev, [roomId]: new Date().toISOString() };
        persistLastSeen(next);
        return next;
      });
    },
    [persistLastSeen]
  );

  const unreadByRoom = useMemo(
    () =>
      Object.fromEntries(
        rooms.map((room) => {
          const meta = roomMeta[room.id];
          const latest = toEpoch(meta?.lastMessageAt ?? room.updated_at);
          const seen = toEpoch(lastSeenByRoom[room.id]);
          return [room.id, latest > seen];
        })
      ),
    [lastSeenByRoom, roomMeta, rooms]
  );

  const filteredRooms = useMemo(() => {
    const normalizedQuery = debouncedQuery.trim().toLowerCase();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    const pinnedSet = new Set(pinnedRoomIds);

    const base = rooms.filter((room) => {
      const meta = roomMeta[room.id];
      const searchableText = `${room.name} ${meta?.lastMessage ?? ''}`.toLowerCase();
      if (normalizedQuery && !searchableText.includes(normalizedQuery)) return false;
      if (selectedAgentId && !meta?.agents.some((agent) => agent.id === selectedAgentId)) return false;
      if (recentOnly && now - toEpoch(meta?.lastMessageAt ?? room.updated_at) > sevenDaysMs) return false;
      if (unreadOnly && !unreadByRoom[room.id]) return false;
      return true;
    });

    return [...base].sort((a, b) => {
      const aPinned = pinnedSet.has(a.id);
      const bPinned = pinnedSet.has(b.id);
      if (aPinned !== bPinned) return aPinned ? -1 : 1;

      const aMeta = roomMeta[a.id];
      const bMeta = roomMeta[b.id];

      if (sortMode === 'mentions') {
        const mentionDiff = Number(Boolean(bMeta?.hasMention)) - Number(Boolean(aMeta?.hasMention));
        if (mentionDiff !== 0) return mentionDiff;
      }

      if (sortMode === 'tasks') {
        const taskDiff = Number(Boolean(bMeta?.hasTask)) - Number(Boolean(aMeta?.hasTask));
        if (taskDiff !== 0) return taskDiff;
      }

      return toEpoch(bMeta?.lastMessageAt ?? b.updated_at) - toEpoch(aMeta?.lastMessageAt ?? a.updated_at);
    });
  }, [
    pinnedRoomIds,
    debouncedQuery,
    recentOnly,
    roomMeta,
    rooms,
    selectedAgentId,
    sortMode,
    unreadByRoom,
    unreadOnly,
  ]);

  const renderRoomItem = useCallback(
    ({ item: room }: { item: ChatRoom }) => {
      const meta = roomMeta[room.id];
      return (
        <RoomCard
          room={room}
          agents={meta?.agents ?? []}
          lastMessage={meta?.lastMessage}
          lastMessageAt={meta?.lastMessageAt}
          unread={Boolean(unreadByRoom[room.id])}
          pinned={pinnedRoomIds.includes(room.id)}
          onTogglePin={() => togglePinnedRoom(room.id)}
          onPress={() => {
            markRoomAsSeen(room.id);
            router.push(`/(main)/chat/${room.id}`);
          }}
        />
      );
    },
    [markRoomAsSeen, pinnedRoomIds, roomMeta, router, togglePinnedRoom, unreadByRoom]
  );

  const activeFilterCount = Number(Boolean(selectedAgentId)) + Number(recentOnly) + Number(unreadOnly);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
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
          accessibilityRole="button"
          accessibilityLabel={t('chat.new_chat', 'New chat')}
        >
          <Ionicons name="add" size={22} color="white" />
        </ScalePressable>
      </View>

      {metaError || hubError ? <ChatInlineBanner text={metaError ?? hubError ?? ''} tone="error" /> : null}

      <FlatList
        data={filteredRooms}
        keyExtractor={(item) => item.id}
        renderItem={renderRoomItem}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 24 + (Platform.OS === 'ios' ? 32 : 16) + 64,
          paddingHorizontal: 16,
        }}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingRooms || loadingMeta}
            onRefresh={() => {
              setMetaError(null);
              fetchRooms();
              fetchAgents();
            }}
            tintColor={C.primary}
          />
        }
        ListHeaderComponent={
          <ChatListHeader
            t={translate}
            query={query}
            onChangeQuery={setQuery}
            sortMode={sortMode}
            onChangeSortMode={setSortMode}
            recentOnly={recentOnly}
            unreadOnly={unreadOnly}
            onToggleRecentOnly={() => setRecentOnly((prev) => !prev)}
            onToggleUnreadOnly={() => setUnreadOnly((prev) => !prev)}
            agents={agents}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
            activeFilterCount={activeFilterCount}
            roomCount={filteredRooms.length}
          />
        }
        ListEmptyComponent={
          !isLoadingRooms ? (
            <View
              style={{
                alignItems: 'center',
                paddingVertical: 48,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: C.border,
                backgroundColor: C.surface,
                ...DESIGN_TOKENS.shadow,
              }}
            >
              <View
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: 24,
                  backgroundColor: C.primarySurface,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                }}
              >
                <Ionicons name="chatbubbles-outline" size={32} color={C.primary} />
              </View>
              <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
                {debouncedQuery || selectedAgentId || recentOnly || unreadOnly
                  ? t('chat.no_filtered_results', 'No chats match this filter')
                  : t('chat.no_conversations_title', 'No conversations yet')}
              </AppText>
              <AppText
                style={{
                  textAlign: 'center',
                  marginBottom: 24,
                  paddingHorizontal: 24,
                  color: C.muted,
                }}
              >
                {debouncedQuery || selectedAgentId || recentOnly || unreadOnly
                  ? t('chat.try_adjusting_filters', 'Try adjusting filters or start a new chat.')
                  : t(
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
                  borderRadius: 16,
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
            <View style={{ gap: 12, marginTop: 6 }}>
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
