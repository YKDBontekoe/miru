import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  FlatList,
  RefreshControl,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
} from 'react-native-reanimated';
import { AppText } from '../../src/components/AppText';
import { Skeleton } from '../../src/components/Skeleton';
import { useChatStore } from '../../src/store/useChatStore';
import { useAgentStore } from '../../src/store/useAgentStore';
import { ChatRoom, Agent } from '../../src/core/models';
import { theme, activeColors, getAgentColor } from '../../src/core/theme';

// ─── Shared Animated Pressable ───────────────────────────────────────────────
function AnimatedPressable({
  onPress,
  children,
  style,
  disabled = false,
}: {
  onPress: () => void;
  children: React.ReactNode;
  style?: any;
  disabled?: boolean;
}) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 300 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  return (
    <Pressable
      onPress={onPress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
    >
      <Animated.View style={[style, animatedStyle]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── Components ───────────────────────────────────────────────────────────────

function AgentPill({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  const color = getAgentColor(agent.name);
  return (
    <AnimatedPressable onPress={onPress} style={styles.agentPillContainer}>
      <View
        style={[
          styles.agentPillAvatar,
          {
            backgroundColor: `${color}18`,
            borderColor: `${color}40`,
          },
        ]}
      >
        <AppText style={[styles.agentPillText, { color }]}>{agent.name[0].toUpperCase()}</AppText>
      </View>
      <AppText variant="caption" numberOfLines={1} style={styles.agentPillLabel}>
        {agent.name}
      </AppText>
    </AnimatedPressable>
  );
}

function AgentPillSkeleton() {
  return (
    <View style={styles.agentPillContainer}>
      <Skeleton
        width={52}
        height={52}
        borderRadius={26}
        style={{ marginBottom: theme.spacing.xs }}
      />
      <Skeleton width={48} height={12} />
    </View>
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
    <AnimatedPressable onPress={onPress} style={styles.roomCardContainer}>
      <View style={styles.roomCardAvatar}>
        <AppText style={styles.roomCardInitial}>{initial}</AppText>
      </View>
      <View style={styles.roomCardContent}>
        <AppText style={styles.roomCardTitle}>{room.name}</AppText>
        <View style={styles.roomCardMeta}>
          <Ionicons
            name="people-outline"
            size={12}
            color={activeColors.muted}
            style={styles.roomCardMetaIcon}
          />
          <AppText variant="caption" style={styles.roomCardMetaText}>
            {memberLabel()}
          </AppText>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={18} color={activeColors.faint} />
    </AnimatedPressable>
  );
}

function RoomCardSkeleton() {
  return (
    <View style={styles.roomCardContainer}>
      <Skeleton
        width={48}
        height={48}
        borderRadius={theme.borderRadius.md}
        style={{ marginEnd: theme.spacing.md }}
      />
      <View style={styles.roomCardContent}>
        <Skeleton width="60%" height={16} style={{ marginBottom: theme.spacing.xs }} />
        <Skeleton width="40%" height={12} />
      </View>
      <Skeleton width={18} height={18} borderRadius={theme.borderRadius.full} />
    </View>
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

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <AppText variant="h2" style={{ color: activeColors.text }}>
              New Chat
            </AppText>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color={activeColors.faint} />
            </Pressable>
          </View>

          <AppText variant="label" style={styles.modalSectionTitle}>
            Chat Name
          </AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="e.g. Gaming Session"
            placeholderTextColor={activeColors.faint}
            style={styles.modalInput}
          />

          {agents.length > 0 && (
            <>
              <AppText
                variant="label"
                style={[styles.modalSectionTitle, { marginTop: theme.spacing.sm }]}
              >
                Add Agents
              </AppText>
              <ScrollView style={styles.modalAgentList} showsVerticalScrollIndicator={false}>
                {agents.map((agent) => {
                  const color = getAgentColor(agent.name);
                  const selected = selectedAgentIds.includes(agent.id);
                  return (
                    <AnimatedPressable
                      key={agent.id}
                      onPress={() => toggleAgent(agent.id)}
                      style={[
                        styles.modalAgentRow,
                        {
                          backgroundColor: selected ? `${color}10` : activeColors.surfaceHigh,
                          borderColor: selected ? `${color}40` : activeColors.border,
                        },
                      ]}
                    >
                      <View style={[styles.modalAgentAvatar, { backgroundColor: `${color}18` }]}>
                        <AppText style={{ color, fontWeight: '700' }}>
                          {agent.name[0].toUpperCase()}
                        </AppText>
                      </View>
                      <View style={styles.modalAgentInfo}>
                        <AppText style={styles.modalAgentName}>{agent.name}</AppText>
                        <AppText
                          variant="caption"
                          style={styles.modalAgentPersonality}
                          numberOfLines={1}
                        >
                          {agent.personality}
                        </AppText>
                      </View>
                      {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
                    </AnimatedPressable>
                  );
                })}
              </ScrollView>
            </>
          )}

          <AnimatedPressable
            onPress={handleCreate}
            disabled={isSaving}
            style={[
              styles.modalButton,
              { backgroundColor: isSaving ? `${activeColors.primary}80` : activeColors.primary },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={styles.modalButtonText}>Create Chat</AppText>
            )}
          </AnimatedPressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function ChatListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents, isLoading: isLoadingAgents } = useAgentStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [roomAgents] = useState<Record<string, Agent[]>>({});

  useEffect(() => {
    fetchRooms();
    fetchAgents();
  }, [fetchRooms, fetchAgents]);

  const showSkeletons = isLoadingRooms || isLoadingAgents;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <AppText variant="h1" style={styles.headerTitle}>
          {t('chat.title', 'Miru')}
        </AppText>
        <AnimatedPressable onPress={() => setShowCreateModal(true)} style={styles.headerAddButton}>
          <Ionicons name="add" size={22} color="white" />
        </AnimatedPressable>
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
            tintColor={activeColors.primary}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {/* Agents Row */}
        {(agents.length > 0 || showSkeletons) && (
          <View style={styles.agentsSection}>
            <AppText variant="label" style={styles.sectionTitle}>
              {t('chat.personas', 'Personas')}
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.agentsScrollContent}
            >
              {showSkeletons
                ? Array.from({ length: 4 }).map((_, i) => <AgentPillSkeleton key={i} />)
                : agents.map((agent) => (
                    <AgentPill
                      key={agent.id}
                      agent={agent}
                      onPress={() => router.push('/(main)/agents')}
                    />
                  ))}
            </ScrollView>
          </View>
        )}

        {(agents.length > 0 || showSkeletons) && <View style={styles.divider} />}

        {/* Chats Row */}
        <View style={styles.chatsSection}>
          <AppText variant="label" style={styles.sectionTitle}>
            {t('chat.chats', 'Chats')}
          </AppText>

          {showSkeletons ? (
            Array.from({ length: 3 }).map((_, i) => <RoomCardSkeleton key={i} />)
          ) : rooms.length === 0 ? (
            <View style={styles.emptyStateContainer}>
              <View style={styles.emptyStateIconContainer}>
                <Ionicons name="chatbubbles-outline" size={32} color={activeColors.faint} />
              </View>
              <AppText variant="h3" style={styles.emptyStateTitle}>
                {t('chat.no_conversations_title', 'No conversations yet')}
              </AppText>
              <AppText style={styles.emptyStateDesc}>
                {t(
                  'chat.no_conversations_desc',
                  'Create a chat and start collaborating with your AI personas.'
                )}
              </AppText>
              <AnimatedPressable
                onPress={() => setShowCreateModal(true)}
                style={styles.emptyStateButton}
              >
                <Ionicons
                  name="add"
                  size={18}
                  color="white"
                  style={{ marginEnd: theme.spacing.xs }}
                />
                <AppText style={styles.emptyStateButtonText}>
                  {t('chat.new_chat', 'New Chat')}
                </AppText>
              </AnimatedPressable>
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: activeColors.bg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.sm,
    paddingBottom: theme.spacing.lg,
  },
  headerTitle: {
    color: activeColors.text,
  },
  headerAddButton: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    backgroundColor: activeColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.elevation.sm,
  },
  scrollContent: {
    paddingBottom: theme.spacing.xxl,
  },
  sectionTitle: {
    color: activeColors.muted,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  agentsSection: {
    marginBottom: theme.spacing.sm,
  },
  agentsScrollContent: {
    paddingHorizontal: theme.spacing.xl,
    paddingBottom: theme.spacing.xs,
  },
  agentPillContainer: {
    width: 72,
    alignItems: 'center',
    marginEnd: theme.spacing.md,
  },
  agentPillAvatar: {
    width: 52,
    height: 52,
    borderRadius: theme.borderRadius.full,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.xs,
  },
  agentPillText: {
    fontSize: 20,
    fontWeight: '700',
  },
  agentPillLabel: {
    textAlign: 'center',
    fontSize: theme.typography.label.fontSize,
    color: activeColors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: activeColors.borderLight,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.xl,
  },
  chatsSection: {
    paddingHorizontal: theme.spacing.xl,
  },
  roomCardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: activeColors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: 14,
    marginBottom: theme.spacing.md,
    borderWidth: 1,
    borderColor: activeColors.border,
    ...theme.elevation.sm,
  },
  roomCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: theme.borderRadius.md,
    backgroundColor: activeColors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: 14,
  },
  roomCardInitial: {
    color: activeColors.primary,
    fontSize: 20,
    fontWeight: '700',
  },
  roomCardContent: {
    flex: 1,
  },
  roomCardTitle: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
    color: activeColors.text,
    marginBottom: theme.spacing.xxs,
  },
  roomCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roomCardMetaIcon: {
    marginEnd: theme.spacing.xs,
  },
  roomCardMetaText: {
    color: activeColors.muted,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.massive,
  },
  emptyStateIconContainer: {
    width: 72,
    height: 72,
    borderRadius: theme.borderRadius.full,
    backgroundColor: activeColors.surfaceHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.lg,
    borderWidth: 1,
    borderColor: activeColors.border,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
    color: activeColors.text,
  },
  emptyStateDesc: {
    textAlign: 'center',
    marginBottom: theme.spacing.xxl,
    paddingHorizontal: theme.spacing.xxl,
    color: activeColors.muted,
    lineHeight: theme.typography.body.lineHeight,
  },
  emptyStateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: activeColors.primary,
    borderRadius: theme.borderRadius.md,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xxl,
    ...theme.elevation.md,
  },
  emptyStateButtonText: {
    color: 'white',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    backgroundColor: activeColors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xxl,
    maxHeight: '82%',
    ...theme.elevation.modal,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  modalSectionTitle: {
    color: activeColors.muted,
    marginBottom: theme.spacing.sm,
  },
  modalInput: {
    backgroundColor: activeColors.surfaceHigh,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: activeColors.border,
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.md,
    color: activeColors.text,
    fontSize: theme.typography.body.fontSize,
    marginBottom: theme.spacing.xl,
  },
  modalAgentList: {
    maxHeight: 180,
  },
  modalAgentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.md,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
  },
  modalAgentAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md,
  },
  modalAgentInfo: {
    flex: 1,
  },
  modalAgentName: {
    fontSize: theme.typography.bodySm.fontSize,
    fontWeight: '600',
    color: activeColors.text,
  },
  modalAgentPersonality: {
    color: activeColors.muted,
  },
  modalButton: {
    borderRadius: theme.borderRadius.md,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
  },
  modalButtonText: {
    color: 'white',
    fontWeight: '700',
    fontSize: theme.typography.body.fontSize,
  },
});
