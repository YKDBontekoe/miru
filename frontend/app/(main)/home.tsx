import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../src/components/AppText';
import { useChatStore } from '../../src/store/useChatStore';
import { useAgentStore } from '../../src/store/useAgentStore';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Agent, ChatRoom, Task } from '../../src/core/models';

// ─── Palette ─────────────────────────────────────────────────────────────────
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
  primaryLight: '#60A5FA',
  primarySurface: '#EFF6FF',
  success: '#34D399',
  successSurface: '#ECFDF5',
  warning: '#FBBF24',
  warningSurface: '#FFFBEB',
  purple: '#8B5CF6',
  purpleSurface: '#F5F3FF',
  teal: '#14B8A6',
  tealSurface: '#F0FDFA',
};

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return palette[Math.abs(hash) % palette.length];
}

function getGreeting(hour: number): string {
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function getFirstName(email?: string): string {
  if (!email) return 'there';
  const local = email.split('@')[0];
  // Capitalize first letter, cut at dot/underscore/number
  const name = local.split(/[._0-9]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

// Performance Log: Extracted styles to StyleSheet to avoid inline object recreation on each render.
const styles = StyleSheet.create({
  quickActionWrapper: { flex: 1, alignItems: 'center' },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
    borderWidth: 1,
  },
  quickActionText: { fontSize: 12, fontWeight: '600', color: C.muted, textAlign: 'center' },
  statCardWrapper: {
    flex: 1,
    backgroundColor: C.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'flex-start',
  },
  statCardIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  statCardValue: { fontSize: 24, fontWeight: '700', color: C.text, marginBottom: 2 },
  statCardLabel: { fontSize: 12, color: C.muted },
  recentChatWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  recentChatIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: C.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentChatInitial: { color: C.primary, fontSize: 16, fontWeight: '700' },
  recentChatTitle: { fontSize: 14, fontWeight: '600', color: C.text },
  recentChatSubtitle: { fontSize: 12, color: C.muted, marginTop: 1 },
  recentChatTime: { fontSize: 11, color: C.faint },
  taskRowWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.borderLight,
  },
  taskRowIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  taskRowTitle: { flex: 1, fontSize: 14 },
  taskRowDate: { fontSize: 11, color: C.warning },
  agentChipWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderWidth: 1,
    marginRight: 8,
    marginBottom: 8,
  },
  agentChipIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 7,
  },
  agentChipInitial: { fontSize: 12, fontWeight: '700' },
  agentChipName: { fontSize: 13, fontWeight: '600', color: C.text },
  agentChipBadge: {
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 1,
    marginLeft: 6,
  },
  agentChipBadgeText: { fontSize: 10, color: 'white', fontWeight: '700' },
  sectionHeaderWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionHeaderAction: { fontSize: 13, color: C.primary, fontWeight: '600' },
});

// ─── Quick-action button ─────────────────────────────────────────────────────
const QuickAction = React.memo(function QuickAction({
  icon,
  label,
  color,
  bg,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  color: string;
  bg: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.quickActionWrapper}>
      <View style={[styles.quickActionIcon, { backgroundColor: bg, borderColor: `${color}20` }]}>
        <Ionicons name={icon} size={22} color={color} />
      </View>
      <AppText style={styles.quickActionText}>{label}</AppText>
    </TouchableOpacity>
  );
});

// ─── Stat card ────────────────────────────────────────────────────────────────
const StatCard = React.memo(function StatCard({
  value,
  label,
  icon,
  color,
  bg,
}: {
  value: number;
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  color: string;
  bg: string;
}) {
  return (
    <View style={styles.statCardWrapper}>
      <View style={[styles.statCardIcon, { backgroundColor: bg }]}>
        <Ionicons name={icon} size={18} color={color} />
      </View>
      <AppText style={styles.statCardValue}>{value}</AppText>
      <AppText style={styles.statCardLabel}>{label}</AppText>
    </View>
  );
});

// ─── Recent chat row ─────────────────────────────────────────────────────────
const RecentChatRow = React.memo(function RecentChatRow({
  room,
  onPress,
}: {
  room: ChatRoom;
  onPress: (id: string) => void;
}) {
  const initial = room.name[0]?.toUpperCase() ?? '?';
  const relativeTime = () => {
    const diff = Date.now() - new Date(room.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const handlePress = useCallback(() => onPress(room.id), [room.id, onPress]);

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.75} style={styles.recentChatWrapper}>
      <View style={styles.recentChatIcon}>
        <AppText style={styles.recentChatInitial}>{initial}</AppText>
      </View>
      <View style={{ flex: 1 }}>
        <AppText style={styles.recentChatTitle}>{room.name}</AppText>
        <AppText style={styles.recentChatSubtitle}>Tap to continue</AppText>
      </View>
      <AppText style={styles.recentChatTime}>{relativeTime()}</AppText>
      <Ionicons name="chevron-forward" size={14} color={C.faint} style={{ marginLeft: 6 }} />
    </TouchableOpacity>
  );
});

// ─── Task row ────────────────────────────────────────────────────────────────
const TaskRow = React.memo(function TaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: (id: string, completed: boolean) => Promise<void> | void;
}) {
  const handleToggle = useCallback(async () => {
    try {
      await onToggle(task.id, !task.completed);
    } catch {
      // Best effort toggle
    }
  }, [task.id, task.completed, onToggle]);

  return (
    <TouchableOpacity
      onPress={handleToggle}
      activeOpacity={0.75}
      className="flex-row items-center bg-surfaceHigh rounded-2xl p-3.5 mb-2"
    >
      <View
        className="w-5 h-5 rounded-full border-[1.5px] items-center justify-center mr-3"
        style={[
          {
            borderColor: task.completed ? C.success : C.faint,
            backgroundColor: task.completed ? C.success : 'transparent',
          },
        ]}
      >
        {task.completed && <Ionicons name="checkmark" size={12} color="white" />}
      </View>
      <AppText
        className="flex-1 text-[15px] font-medium"
        style={[
          {
            color: task.completed ? C.faint : C.text,
            textDecorationLine: task.completed ? 'line-through' : 'none',
          },
        ]}
      >
        {task.title}
      </AppText>
      {task.due_date && (
        <AppText className="text-xs ml-2" style={{ color: C.muted }}>
          {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </AppText>
      )}
    </TouchableOpacity>
  );
});

// ─── Agent chip ──────────────────────────────────────────────────────────────
const AgentChip = React.memo(function AgentChip({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: (id: string) => void;
}) {
  const color = getAgentColor(agent.name);
  const handlePress = useCallback(() => onPress(agent.id), [agent.id, onPress]);
  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      style={[
        styles.agentChipWrapper,
        { backgroundColor: `${color}10`, borderColor: `${color}25` },
      ]}
    >
      <View style={[styles.agentChipIcon, { backgroundColor: `${color}20` }]}>
        <AppText style={[styles.agentChipInitial, { color }]}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <AppText style={styles.agentChipName}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View style={[styles.agentChipBadge, { backgroundColor: color }]}>
          <AppText style={styles.agentChipBadgeText}>{agent.message_count}</AppText>
        </View>
      )}
    </TouchableOpacity>
  );
});

// ─── Section header ──────────────────────────────────────────────────────────
const SectionHeader = React.memo(function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeaderWrapper}>
      <AppText style={styles.sectionHeaderTitle}>{title}</AppText>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction}>
          <AppText style={styles.sectionHeaderAction}>{actionLabel}</AppText>
        </TouchableOpacity>
      )}
    </View>
  );
});

// ─── New chat modal (inline, minimal) ────────────────────────────────────────
function NewChatModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { createRoom } = useChatStore();

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a name for this chat.');
      return;
    }
    setIsSaving(true);
    try {
      await createRoom(name.trim());
      setName('');
      onCreated();
      onClose();
    } catch {
      Alert.alert('Error', 'Failed to create chat. Please try again.');
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
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 20,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              New Chat
            </AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={26} color={C.faint} />
            </TouchableOpacity>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder="Chat name…"
            placeholderTextColor={C.faint}
            autoFocus
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.border,
              paddingHorizontal: 14,
              paddingVertical: 12,
              color: C.text,
              fontSize: 16,
              marginBottom: 16,
            }}
          />
          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}80` : C.primary,
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>Create</AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ─────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const { tasks, fetchTasks, toggleTask } = useProductivityStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = getGreeting(hour);
  const firstName = getFirstName(user?.email);

  const recentRooms = [...rooms]
    .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
    .slice(0, 3);

  const pendingTasks = tasks.filter((t) => !t.completed).slice(0, 4);
  const completedCount = tasks.filter((t) => t.completed).length;
  const topAgents = agents.slice(0, 5);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
  }, [fetchRooms, fetchAgents, fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
    setRefreshing(false);
  };

  const handleRecentChatPress = useCallback(
    (id: string) => {
      router.push(`/(main)/chat/${id}`);
    },
    [router]
  );

  const handleAgentPress = useCallback(
    (id: string) => {
      router.push('/(main)/agents');
    },
    [router]
  );

  const handleSeeAllChats = useCallback(() => {
    router.push('/(main)/chat');
  }, [router]);

  const handleSeeAllTasks = useCallback(() => {
    router.push('/(main)/productivity');
  }, [router]);

  const handleSeeAllAgents = useCallback(() => {
    router.push('/(main)/agents');
  }, [router]);

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center' }}
      >
        <ActivityIndicator size="large" color={C.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 20,
          paddingTop: 8,
          paddingBottom: 4,
        }}
      >
        <View>
          <AppText style={{ fontSize: 13, color: C.muted, fontWeight: '500' }}>{greeting}</AppText>
          <AppText style={{ fontSize: 26, fontWeight: '700', color: C.text }}>{firstName}</AppText>
        </View>
        <TouchableOpacity
          onPress={() => setShowNewChat(true)}
          style={{
            width: 40,
            height: 40,
            borderRadius: 20,
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
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 20, paddingBottom: 32 }}
      >
        {/* Stats row */}
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 24 }}>
          <StatCard
            value={rooms.length}
            label="Chats"
            icon="chatbubbles"
            color={C.primary}
            bg={C.primarySurface}
          />
          <StatCard
            value={agents.length}
            label="Agents"
            icon="people"
            color={C.purple}
            bg={C.purpleSurface}
          />
          <StatCard
            value={completedCount}
            label="Done"
            icon="checkmark-circle"
            color={C.success}
            bg={C.successSurface}
          />
        </View>

        {/* Quick actions */}
        <View
          style={{
            backgroundColor: C.surface,
            borderRadius: 20,
            padding: 18,
            borderWidth: 1,
            borderColor: C.border,
            marginBottom: 20,
          }}
        >
          <SectionHeader title="Quick Actions" />
          <View style={{ flexDirection: 'row' }}>
            <QuickAction
              icon="chatbubble-ellipses"
              label="New Chat"
              color={C.primary}
              bg={C.primarySurface}
              onPress={() => setShowNewChat(true)}
            />
            <QuickAction
              icon="person-add"
              label="New Agent"
              color={C.purple}
              bg={C.purpleSurface}
              onPress={() => router.push('/(main)/agents')}
            />
            <QuickAction
              icon="document-text"
              label="New Note"
              color={C.teal}
              bg={C.tealSurface}
              onPress={() => router.push('/(main)/productivity')}
            />
            <QuickAction
              icon="checkbox"
              label="New Task"
              color={C.warning}
              bg={C.warningSurface}
              onPress={() => router.push('/(main)/productivity')}
            />
          </View>
        </View>

        {/* Recent chats */}
        {recentRooms.length > 0 && (
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 20,
            }}
          >
            <SectionHeader
              title="Recent Chats"
              actionLabel="See All"
              onAction={handleSeeAllChats}
            />
            {recentRooms.map((room) => (
              <RecentChatRow key={room.id} room={room} onPress={handleRecentChatPress} />
            ))}
          </View>
        )}

        {/* Today's tasks */}
        {tasks.length > 0 && (
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 20,
            }}
          >
            <SectionHeader
              title={
                pendingTasks.length > 0
                  ? `Tasks · ${pendingTasks.length} open`
                  : 'Tasks · All done!'
              }
              actionLabel="See All"
              onAction={handleSeeAllTasks}
            />
            {pendingTasks.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 12 }}>
                <Ionicons
                  name="checkmark-circle"
                  size={32}
                  color={C.success}
                  style={{ marginBottom: 6 }}
                />
                <AppText style={{ color: C.muted, fontSize: 13 }}>You're all caught up!</AppText>
              </View>
            ) : (
              pendingTasks.map((task) => (
                <TaskRow key={task.id} task={task} onToggle={toggleTask} />
              ))
            )}
          </View>
        )}

        {/* Active agents */}
        {topAgents.length > 0 && (
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 20,
              padding: 18,
              borderWidth: 1,
              borderColor: C.border,
              marginBottom: 20,
            }}
          >
            <SectionHeader title="Your Agents" actionLabel="Manage" onAction={handleSeeAllAgents} />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
              {topAgents.map((agent) => (
                <AgentChip key={agent.id} agent={agent} onPress={handleAgentPress} />
              ))}
            </View>
          </View>
        )}

        {/* Empty state when nothing exists yet */}
        {rooms.length === 0 && agents.length === 0 && tasks.length === 0 && !isLoadingRooms && (
          <View style={{ alignItems: 'center', paddingVertical: 40 }}>
            <View
              style={{
                width: 80,
                height: 80,
                borderRadius: 40,
                backgroundColor: C.primarySurface,
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                borderWidth: 1,
                borderColor: C.border,
              }}
            >
              <Ionicons name="sparkles" size={36} color={C.primary} />
            </View>
            <AppText variant="h3" style={{ marginBottom: 8, textAlign: 'center', color: C.text }}>
              Welcome to Miru
            </AppText>
            <AppText
              style={{
                textAlign: 'center',
                color: C.muted,
                paddingHorizontal: 32,
                marginBottom: 24,
              }}
            >
              Create an agent and start a chat to get going.
            </AppText>
            <TouchableOpacity
              onPress={() => setShowNewChat(true)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: C.primary,
                borderRadius: 14,
                paddingVertical: 12,
                paddingHorizontal: 24,
              }}
            >
              <Ionicons name="add" size={18} color="white" style={{ marginRight: 6 }} />
              <AppText style={{ color: 'white', fontWeight: '700' }}>Start a Chat</AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}
