import React, { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActionSheetIOS,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import Animated, { FadeIn } from 'react-native-reanimated';
import { AppText } from '../../src/components/AppText';
import { SkeletonAgentCard } from '../../src/components/SkeletonCard';
import { Snackbar } from '../../src/components/Snackbar';
import { ScalePressable } from '../../src/components/ScalePressable';
import { PinnedChip } from '../../src/components/agents/PinnedChip';
import { TemplateGallerySheet } from '../../src/components/agents/TemplateGallerySheet';
import { CreateAgentSheet } from '../../src/components/agents/CreateAgentSheet';
import { AgentDetailSheet } from '../../src/components/agents/AgentDetailSheet';
import { AgentCard, AgentGridCard } from '../../src/components/agents/AgentCard';
import { EmptyState } from '../../src/components/agents/EmptyState';
import { useAgentStore, AgentTemplate } from '../../src/store/useAgentStore';
import { ApiService } from '../../src/core/api/ApiService';
import { useChatStore } from '../../src/store/useChatStore';
import { useTheme } from '../../src/hooks/useTheme';
import { haptic } from '../../src/utils/haptics';
import { Agent } from '../../src/core/models';

export default function AgentsScreen() {
  const { C } = useTheme();
  const router = useRouter();
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
  } = useAgentStore();
  const { createRoom, addAgentToRoom } = useChatStore();

  const [showCreateSheet, setShowCreateSheet] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [createPrefill, setCreatePrefill] = useState<AgentTemplate | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');

  // Undo-delete state
  const [snackbar, setSnackbar] = useState<{ visible: boolean; agent: Agent | null }>({
    visible: false,
    agent: null,
  });
  const pendingDelete = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  // Debounce search to avoid filtering on every keystroke
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 250);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const filteredAgents = useMemo(() => {
    const q = debouncedQuery.toLowerCase().trim();
    if (!q) return agents;
    return agents.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.personality.toLowerCase().includes(q) ||
        (a.description ?? '').toLowerCase().includes(q)
    );
  }, [agents, debouncedQuery]);

  const pinnedAgents = useMemo(
    () => agents.filter((a) => pinnedIds.includes(a.id)),
    [agents, pinnedIds]
  );

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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ── Header ── */}
      <View style={{ paddingHorizontal: 20, paddingTop: 8, paddingBottom: 10 }}>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 12,
          }}
        >
          <View>
            <AppText
              style={{ fontSize: 28, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}
            >
              Personas
            </AppText>
            <AppText style={{ color: C.muted, fontSize: 13, marginTop: 1 }}>
              {agents.length === 0
                ? 'Your AI companions'
                : `${agents.length} persona${agents.length !== 1 ? 's' : ''}`}
            </AppText>
          </View>

          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            {/* View toggle */}
            {agents.length > 0 && (
              <View
                style={{
                  flexDirection: 'row',
                  backgroundColor: C.surfaceHigh,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: C.border,
                  overflow: 'hidden',
                }}
              >
                {(['list', 'grid'] as const).map((mode) => (
                  <TouchableOpacity
                    key={mode}
                    onPress={() => {
                      haptic.selection();
                      setViewMode(mode);
                    }}
                    style={{
                      padding: 7,
                      backgroundColor: viewMode === mode ? C.primary : 'transparent',
                    }}
                  >
                    <Ionicons
                      name={mode === 'list' ? 'list' : 'grid'}
                      size={15}
                      color={viewMode === mode ? 'white' : C.muted}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* Templates */}
            {agents.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  haptic.light();
                  setShowTemplates(true);
                }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: C.surfaceHigh,
                  borderWidth: 1,
                  borderColor: C.border,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Ionicons name="albums-outline" size={17} color={C.muted} />
              </TouchableOpacity>
            )}

            {/* New button */}
            <ScalePressable
              onPress={() => {
                haptic.light();
                setShowCreateSheet(true);
              }}
            >
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: C.primary,
                  borderRadius: 14,
                  paddingHorizontal: 16,
                  paddingVertical: 10,
                  shadowColor: C.primary,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: 0.25,
                  shadowRadius: 6,
                  elevation: 3,
                }}
              >
                <Ionicons name="add" size={18} color="white" style={{ marginEnd: 4 }} />
                <AppText style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>New</AppText>
              </View>
            </ScalePressable>
          </View>
        </View>

        {/* Search */}
        {agents.length > 0 && (
          <Animated.View entering={FadeIn.delay(200).duration(300)}>
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.surface,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: C.border,
                paddingHorizontal: 12,
                paddingVertical: 10,
              }}
            >
              <Ionicons name="search" size={15} color={C.faint} style={{ marginEnd: 8 }} />
              <TextInput
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search personas…"
                placeholderTextColor={C.faint}
                style={{ flex: 1, color: C.text, fontSize: 14 }}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={16} color={C.faint} />
                </TouchableOpacity>
              )}
            </View>
          </Animated.View>
        )}
      </View>

      {/* ── Pinned strip ── */}
      {pinnedAgents.length > 0 && !debouncedQuery && (
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
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {pinnedAgents.map((agent) => (
              <PinnedChip
                key={agent.id}
                agent={agent}
                onPress={() => {
                  haptic.light();
                  setSelectedAgent(agent);
                }}
              />
            ))}
          </ScrollView>
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
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={{ paddingHorizontal: 15, paddingBottom: 48, paddingTop: 6 }}
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
          data={filteredAgents}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 48 }}
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
