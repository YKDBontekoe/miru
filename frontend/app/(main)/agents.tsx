import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { View, FlatList, RefreshControl, Alert, ActionSheetIOS, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, usePathname, useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../src/components/AppText';
import { SkeletonAgentCard } from '../../src/components/SkeletonCard';
import { Snackbar } from '../../src/components/Snackbar';
import { PinnedChip } from '../../src/components/agents/PinnedChip';
import { TemplateGallerySheet } from '../../src/components/agents/TemplateGallerySheet';
import { CreateAgentSheet } from '../../src/components/agents/CreateAgentSheet';
import { AgentDetailSheet } from '../../src/components/agents/AgentDetailSheet';
import { AgentCard, AgentGridCard } from '../../src/components/agents/AgentCard';
import { EmptyState } from '../../src/components/agents/EmptyState';
import { AgentsHeader } from '@/components/agents/AgentsHeader';
import { AgentsFilters } from '@/components/agents/AgentsFilters';
import { useAgentStore, AgentTemplate } from '../../src/store/useAgentStore';
import { useChatStore } from '../../src/store/useChatStore';
import { haptic } from '../../src/utils/haptics';
import { Agent } from '../../src/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';

export default function AgentsScreen() {
  const C = {
    bg: DESIGN_TOKENS.colors.pageBg,
    surface: DESIGN_TOKENS.colors.surface,
    surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
    border: DESIGN_TOKENS.colors.border,
    text: DESIGN_TOKENS.colors.text,
    muted: DESIGN_TOKENS.colors.muted,
    faint: DESIGN_TOKENS.colors.faint,
    primary: DESIGN_TOKENS.colors.primary,
  };
  const router = useRouter();
  const pathname = usePathname();
  const params = useLocalSearchParams() as Record<string, string | string[] | undefined>;
  const openCreate = params.openCreate;
  const {
    agents,
    fetchAgents,
    isLoading,
    pinnedIds,
    togglePin,
    viewMode,
    setViewMode,
    deleteAgent,
    confirmDelete,
    restoreAgent,
    duplicateAgent,
    templates,
    fetchTemplates,
  } = useAgentStore();
  const { createRoom, addAgentToRoom } = useChatStore();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [createPrefill, setCreatePrefill] = useState<AgentTemplate | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [sortMode, setSortMode] = useState<'recent' | 'messages' | 'name'>('recent');
  const [filterMode, setFilterMode] = useState<'all' | 'pinned' | 'active'>('all');
  const [templateCategory, setTemplateCategory] = useState<
    'all' | 'work' | 'planning' | 'creative'
  >('all');

  // Undo-delete state
  const [snackbar, setSnackbar] = useState<{ visible: boolean; agent: Agent | null }>({
    visible: false,
    agent: null,
  });
  const pendingDelete = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  useEffect(() => {
    if (openCreate === '1' || openCreate === 'true') {
      setShowCreateSheet(true);
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

  // Debounce search to avoid filtering on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredAgents = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    const queried = !q
      ? agents
      : agents.filter(
          (a) =>
            a.name.toLowerCase().includes(q) ||
            a.personality.toLowerCase().includes(q) ||
            (a.description ?? '').toLowerCase().includes(q)
        );
    const filtered =
      filterMode === 'all'
        ? queried
        : filterMode === 'pinned'
          ? queried.filter((a) => pinnedIds.includes(a.id))
          : queried.filter((a) => a.message_count > 0);

    return [...filtered].sort((a, b) => {
      if (sortMode === 'messages') {
        return b.message_count - a.message_count;
      }
      if (sortMode === 'name') {
        return a.name.localeCompare(b.name);
      }
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [agents, debouncedQuery, filterMode, pinnedIds, sortMode]);

  const categoryCount = useMemo(() => {
    const counts: Record<'all' | 'work' | 'planning' | 'creative', number> = {
      all: templates.length,
      work: 0,
      planning: 0,
      creative: 0,
    };
    templates.forEach((template) => {
      const haystack =
        `${template.name} ${template.description} ${template.goals.join(' ')}`.toLowerCase();
      const planningMatch =
        haystack.includes('plan') || haystack.includes('task') || haystack.includes('schedule');
      const creativeMatch =
        haystack.includes('creative') || haystack.includes('writer') || haystack.includes('design');
      if (planningMatch) {
        counts.planning += 1;
      }
      if (creativeMatch) {
        counts.creative += 1;
      }
      if (!planningMatch && !creativeMatch) {
        counts.work += 1;
      }
    });
    return counts;
  }, [templates]);

  const pinnedAgents = useMemo(
    () => agents.filter((a) => pinnedIds.includes(a.id)),
    [agents, pinnedIds]
  );

  useEffect(() => {
    if (templates.length === 0) {
      fetchTemplates().catch(() => {});
    }
  }, [templates.length, fetchTemplates]);

  const handleAgentUpdated = useCallback(
    (updated: Agent) => {
      if (selectedAgent?.id === updated.id) setSelectedAgent(updated);
    },
    [selectedAgent?.id]
  );

  const SNACKBAR_DURATION = 4500;

  const handleArchive = useCallback(
    (agent: Agent) => {
      haptic.medium();
      // Optimistic removal — no server call yet
      deleteAgent(agent.id);
      // Cancel any previous pending delete
      if (pendingDelete.current) clearTimeout(pendingDelete.current);
      setSnackbar({ visible: true, agent });
      // Commit server delete after undo window expires
      pendingDelete.current = setTimeout(() => {
        confirmDelete(agent.id).catch(() => {
          restoreAgent(agent);
          Alert.alert('Archive failed', 'Could not archive this persona. Please try again.');
        });
      }, SNACKBAR_DURATION);
    },
    [deleteAgent, confirmDelete, restoreAgent]
  );

  const handleUndo = useCallback(() => {
    if (pendingDelete.current) clearTimeout(pendingDelete.current);
    if (snackbar.agent) {
      restoreAgent(snackbar.agent);
      haptic.success();
    }
    setSnackbar({ visible: false, agent: null });
  }, [snackbar.agent, restoreAgent]);

  const showQuickActions = useCallback(
    (agent: Agent) => {
      haptic.heavy();
      if (Platform.OS === 'ios') {
        ActionSheetIOS.showActionSheetWithOptions(
          {
            title: agent.name,
            message: agent.personality.slice(0, 80) + (agent.personality.length > 80 ? '…' : ''),
            options: [
              'Cancel',
              'Start Chat',
              pinnedIds.includes(agent.id) ? 'Unpin' : 'Pin to Top',
              'Duplicate',
              'Edit',
              'Archive',
            ],
            cancelButtonIndex: 0,
            destructiveButtonIndex: 5,
          },
          async (i) => {
            if (i === 1) {
              haptic.medium();
              try {
                const room = await createRoom(agent.name);
                await addAgentToRoom(room.id, agent.id);
                router.push(`/(main)/chat/${room.id}`);
              } catch {
                Alert.alert('Error', 'Could not start a chat. Please try again.');
              }
            } else if (i === 2) {
              haptic.selection();
              togglePin(agent.id);
            } else if (i === 3) {
              haptic.light();
              duplicateAgent(agent.id).catch(() => {
                Alert.alert('Error', 'Could not duplicate this persona. Please try again.');
              });
            } else if (i === 4) {
              setSelectedAgent(agent);
            } else if (i === 5) {
              handleArchive(agent);
            }
          }
        );
      } else {
        setSelectedAgent(agent);
      }
    },
    [pinnedIds, togglePin, duplicateAgent, handleArchive, createRoom, addAgentToRoom, router]
  );

  const renderListItem = useCallback(
    ({ item, index }: { item: Agent; index: number }) => (
      <AgentCard
        item={item}
        index={index}
        isPinned={pinnedIds.includes(item.id)}
        onPress={() => {
          haptic.light();
          setSelectedAgent(item);
        }}
        onLongPress={() => showQuickActions(item)}
      />
    ),
    [pinnedIds, showQuickActions]
  );

  const renderGridItem = useCallback(
    ({ item, index }: { item: Agent; index: number }) => (
      <AgentGridCard
        item={item}
        index={index}
        isPinned={pinnedIds.includes(item.id)}
        onPress={() => {
          haptic.light();
          setSelectedAgent(item);
        }}
        onLongPress={() => showQuickActions(item)}
      />
    ),
    [pinnedIds, showQuickActions]
  );

  const renderPinnedAgentItem = useCallback(
    ({ item: agent }: { item: Agent }) => (
      <PinnedChip
        agent={agent}
        onPress={() => {
          haptic.light();
          setSelectedAgent(agent);
        }}
      />
    ),
    [setSelectedAgent]
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      {/* ── Header ── */}
      <AgentsHeader
        agentsCount={agents.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onShowTemplates={() => setShowTemplates(true)}
        onShowCreate={() => setShowCreateSheet(true)}
      />

      {/* ── Filters ── */}
      {agents.length > 0 && (
        <AgentsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          sortMode={sortMode}
          onSortModeChange={setSortMode}
          templateCategory={templateCategory}
          onTemplateCategoryChange={setTemplateCategory}
          categoryCount={categoryCount}
          onShowTemplates={() => setShowTemplates(true)}
        />
      )}
      {/* ── Pinned strip ── */}
      {pinnedAgents.length > 0 && !debouncedQuery && filterMode === 'all' && (
        <Animated.View entering={FadeIn.duration(300)} style={{ marginBottom: 6 }}>
          <View style={{ paddingHorizontal: 20, marginBottom: 6 }}>
            <AppText
              style={{
                color: C.muted,
                fontSize: 11,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.8,
              }}
            >
              Pinned
            </AppText>
          </View>
          <FlatList
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
            data={pinnedAgents}
            keyExtractor={(item) => item.id}
            renderItem={renderPinnedAgentItem}
          />
          <View
            style={{ height: 1, backgroundColor: C.border, marginHorizontal: 20, marginTop: 14 }}
          />
        </Animated.View>
      )}

      {/* ── Agent list / grid / skeleton ── */}
      {isLoading && agents.length === 0 ? (
        <View style={{ paddingHorizontal: 20, paddingTop: 8 }}>
          {[0, 1, 2].map((i) => (
            <SkeletonAgentCard key={i} index={i} />
          ))}
        </View>
      ) : viewMode === 'grid' ? (
        <FlatList
          key="grid"
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 15,
            paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 64,
            paddingTop: 6,
          }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAgents} tintColor={C.primary} />
          }
          renderItem={renderGridItem}
          ListEmptyComponent={
            <EmptyState
              searchQuery={debouncedQuery}
              onCreate={() => setShowCreateSheet(true)}
              onBrowse={() => setShowTemplates(true)}
            />
          }
        />
      ) : (
        <FlatList
          key="list"
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 64,
          }}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchAgents} tintColor={C.primary} />
          }
          renderItem={renderListItem}
          ListEmptyComponent={
            <EmptyState
              searchQuery={debouncedQuery}
              onCreate={() => setShowCreateSheet(true)}
              onBrowse={() => setShowTemplates(true)}
            />
          }
        />
      )}

      {/* ── Sheets ── */}
      <CreateAgentSheet
        visible={showCreateSheet}
        onClose={() => {
          setShowCreateSheet(false);
          setCreatePrefill(undefined);
        }}
        onCreated={fetchAgents}
        prefill={createPrefill}
      />
      <TemplateGallerySheet
        visible={showTemplates}
        onClose={() => setShowTemplates(false)}
        initialCategory={templateCategory}
        onSelect={(t) => {
          setCreatePrefill(t);
          setShowTemplates(false);
          setShowCreateSheet(true);
        }}
      />
      <AgentDetailSheet
        agent={selectedAgent}
        visible={selectedAgent !== null}
        onClose={() => setSelectedAgent(null)}
        onDeleted={(agent) => {
          setSelectedAgent(null);
          handleArchive(agent);
        }}
        onUpdated={handleAgentUpdated}
      />

      {/* ── Undo snackbar ── */}
      <Snackbar
        visible={snackbar.visible}
        message={`"${snackbar.agent?.name ?? 'Persona'}" archived`}
        actionLabel="Undo"
        onAction={handleUndo}
        onDismiss={() => setSnackbar((s) => ({ ...s, visible: false }))}
      />
    </SafeAreaView>
  );
}
