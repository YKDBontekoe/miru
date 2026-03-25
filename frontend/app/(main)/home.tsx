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
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { Agent, ChatRoom, Task } from '../../src/core/models';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

// ─── Palette — white + blue only ─────────────────────────────────────────────
const C = {
  bg: '#F4F7FF', // very light blue-white page bg
  surface: '#FFFFFF',
  surfaceHigh: '#EEF3FF', // light blue tint for inputs / secondary surfaces
  border: '#DDE5FF', // soft blue border
  text: '#0A0F2E', // near-black with blue undertone
  muted: '#6370A0', // muted blue-grey
  faint: '#B0BAD8', // very faint blue-grey
  primary: '#2563EB',
  primaryMid: '#3B82F6', // slightly lighter blue
  primaryLight: '#DBEAFE', // very light blue surface
  primaryFaint: '#EFF6FF', // near-white blue
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  listContent: { paddingBottom: 40 },
  headerContainer: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 4,
    marginBottom: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  greetingContainer: { flex: 1, paddingRight: 16 },
  greetingText: { fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 4 },
  firstNameText: {
    fontSize: 30,
    fontWeight: '800',
    color: C.text,
    letterSpacing: -1,
    lineHeight: 36,
  },
  dateText: { fontSize: 13, color: C.faint, marginTop: 5 },
  avatarButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: C.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 },
  statsBar: {
    flexDirection: 'row',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
    backgroundColor: C.bg,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statValue: { fontSize: 20, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '500', marginTop: 2 },
  card: {
    backgroundColor: C.surface,
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 12,
    marginHorizontal: 14,
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: C.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  sectionHeaderAction: {
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: C.primaryFaint,
    borderWidth: 1,
    borderColor: C.primaryLight,
  },
  sectionHeaderActionText: { fontSize: 12, color: C.primary, fontWeight: '600' },
  quickActionRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  quickActionBtn: { width: '48%', marginBottom: 10 },
  quickActionInner: {
    backgroundColor: C.primaryFaint,
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: C.primaryLight,
    alignItems: 'center',
  },
  quickActionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickActionLabel: { fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' },
  recentChatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 11,
  },
  recentChatAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  recentChatInitial: { color: C.primary, fontSize: 15, fontWeight: '700' },
  recentChatContent: { flex: 1, marginRight: 8 },
  recentChatName: { fontSize: 14, fontWeight: '600', color: C.text },
  recentChatDesc: { fontSize: 12, color: C.muted, marginTop: 2 },
  recentChatTime: { fontSize: 11, color: C.faint, marginBottom: 4 },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  taskIconContainer: { marginRight: 12 },
  taskContent: { flex: 1, marginRight: 8 },
  taskTitle: { fontSize: 14, fontWeight: '500', color: C.text },
  emptyTasksContainer: { alignItems: 'center', paddingVertical: 14 },
  emptyTasksText: { color: C.muted, fontSize: 14 },
  agentsWrap: { flexDirection: 'row', flexWrap: 'wrap' },
  agentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.surfaceHigh,
    borderRadius: 12,
    padding: 8,
    paddingRight: 14,
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 10,
    marginRight: 10,
  },
  agentChipAvatar: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  agentChipInitial: { color: C.primary, fontSize: 13, fontWeight: '700' },
  agentChipName: { fontSize: 13, fontWeight: '600', color: C.text },
  emptyHomeContainer: { alignItems: 'center', paddingTop: 40, paddingBottom: 48 },
  emptyHomeIconBox: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: C.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: `${C.primary}20`,
  },
  emptyHomeTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: C.text,
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  emptyHomeDesc: {
    textAlign: 'center',
    color: C.muted,
    paddingHorizontal: 32,
    marginBottom: 28,
    lineHeight: 22,
    fontSize: 14,
  },
  startChatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.primary,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 26,
    shadowColor: C.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  startChatBtnText: { color: 'white', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,15,46,0.35)' },
  modalContent: {
    backgroundColor: C.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: { color: C.text, fontSize: 22, fontWeight: '800' },
  modalLabel: {
    color: C.muted,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: C.surfaceHigh,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: C.text,
    fontSize: 16,
    marginBottom: 24,
  },
  modalCreateBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  modalCreateBtnText: { color: 'white', fontWeight: '700', fontSize: 16 },
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(hour: number, t: any): string {
  if (hour < 12) return t('home.greeting.morning', 'Good morning');
  if (hour < 17) return t('home.greeting.afternoon', 'Good afternoon');
  return t('home.greeting.evening', 'Good evening');
}

function getFirstName(email?: string): string {
  if (!email) return 'there';
  const local = email.split('@')[0];
  const name = local.split(/[._0-9]/)[0];
  return name.charAt(0).toUpperCase() + name.slice(1);
}

function getInitials(email?: string): string {
  if (!email) return '?';
  const local = email.split('@')[0];
  const parts = local.split(/[._]/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return local.slice(0, 2).toUpperCase();
}

function formatDate(): string {
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  }).format(new Date());
}

// ─── Shared Components ───────────────────────────────────────────────────────
const SectionHeader = React.memo(
  ({
    title,
    actionLabel,
    onAction,
  }: {
    title: string;
    actionLabel?: string;
    onAction?: () => void;
  }) => (
    <View style={styles.sectionHeaderRow}>
      <AppText style={styles.sectionHeaderTitle}>{title}</AppText>
      {actionLabel && onAction && (
        <TouchableOpacity onPress={onAction} style={styles.sectionHeaderAction}>
          <AppText style={styles.sectionHeaderActionText}>{actionLabel}</AppText>
        </TouchableOpacity>
      )}
    </View>
  )
);

const QuickAction = React.memo(
  ({ icon, label, onPress }: { icon: IoniconsName; label: string; onPress: () => void }) => (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.quickActionBtn}>
      <View style={styles.quickActionInner}>
        <View style={styles.quickActionIconBox}>
          <Ionicons name={icon} size={21} color={C.primary} />
        </View>
        <AppText style={styles.quickActionLabel} numberOfLines={1}>
          {label}
        </AppText>
      </View>
    </TouchableOpacity>
  )
);

const RecentChatRow = React.memo(
  ({ room, onPress, isLast }: { room: ChatRoom; onPress: () => void; isLast: boolean }) => {
    const { t } = useTranslation();
    const initial = room.name[0]?.toUpperCase() ?? '?';

    const relativeTime = useMemo(() => {
      const diff = Date.now() - new Date(room.updated_at).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 60)
        return t('home.time.minutes_ago_one', { count: mins, defaultValue: `${mins}m` });
      const hrs = Math.floor(mins / 60);
      if (hrs < 24) return t('home.time.hours_ago_one', { count: hrs, defaultValue: `${hrs}h` });
      return t('home.time.days_ago_one', {
        count: Math.floor(hrs / 24),
        defaultValue: `${Math.floor(hrs / 24)}d`,
      });
    }, [room.updated_at, t]);

    return (
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.7}
        style={[
          styles.recentChatRow,
          { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: C.border },
        ]}
      >
        <View style={styles.recentChatAvatar}>
          <AppText style={styles.recentChatInitial}>{initial}</AppText>
        </View>
        <View style={styles.recentChatContent}>
          <AppText style={styles.recentChatName} numberOfLines={1}>
            {room.name}
          </AppText>
          <AppText style={styles.recentChatDesc} numberOfLines={1}>
            {t('home.actions.tap_to_continue', 'Tap to continue')}
          </AppText>
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <AppText style={styles.recentChatTime}>{relativeTime}</AppText>
          <Ionicons name="chevron-forward" size={16} color={C.primaryLight} />
        </View>
      </TouchableOpacity>
    );
  }
);

const TaskRow = React.memo(
  ({ task, onToggle, isLast }: { task: Task; onToggle: () => void; isLast: boolean }) => (
    <View
      style={[styles.taskRow, { borderBottomWidth: isLast ? 0 : 1, borderBottomColor: C.border }]}
    >
      <TouchableOpacity
        onPress={onToggle}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        style={styles.taskIconContainer}
      >
        <Ionicons
          name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
          size={22}
          color={task.completed ? C.primary : C.faint}
        />
      </TouchableOpacity>
      <View style={styles.taskContent}>
        <AppText
          style={[
            styles.taskTitle,
            {
              textDecorationLine: task.completed ? 'line-through' : 'none',
              color: task.completed ? C.muted : C.text,
            },
          ]}
        >
          {task.title}
        </AppText>
      </View>
    </View>
  )
);

const AgentChip = React.memo(({ agent, onPress }: { agent: Agent; onPress: () => void }) => {
  const initial = agent.name[0]?.toUpperCase() ?? '?';
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7} style={styles.agentChip}>
      <View style={styles.agentChipAvatar}>
        <AppText style={styles.agentChipInitial}>{initial}</AppText>
      </View>
      <AppText style={styles.agentChipName} numberOfLines={1}>
        {agent.name}
      </AppText>
    </TouchableOpacity>
  );
});

function NewChatModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const { createRoom } = useChatStore();

  const handleCreate = useCallback(async () => {
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await createRoom(name.trim());
      setName('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('home.error'), t('home.failed_create_chat'));
    } finally {
      setIsSaving(false);
    }
  }, [name, createRoom, onCreated, onClose, t]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeaderRow}>
            <AppText style={styles.modalTitle}>{t('home.new_chat', 'New Chat')}</AppText>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle" size={28} color={C.faint} />
            </TouchableOpacity>
          </View>

          <AppText style={styles.modalLabel}>{t('home.chat_name', 'Chat Name')}</AppText>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('home.chat_name_ph', 'e.g. Brainstorming')}
            placeholderTextColor={C.faint}
            style={styles.modalInput}
            autoFocus
            onSubmitEditing={handleCreate}
          />

          <TouchableOpacity
            onPress={handleCreate}
            disabled={isSaving || !name.trim()}
            style={[
              styles.modalCreateBtn,
              { backgroundColor: isSaving || !name.trim() ? C.muted : C.primary },
            ]}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={styles.modalCreateBtnText}>{t('home.create_chat', 'Create')}</AppText>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main Screen ─────────────────────────────────────────────────────────────
type HomeSection = 'header' | 'quickActions' | 'recentChats' | 'tasks' | 'agents' | 'empty';

export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const { tasks, fetchTasks } = useProductivityStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchRooms();
    fetchAgents();
    fetchTasks();
  }, [fetchRooms, fetchAgents, fetchTasks]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
    setRefreshing(false);
  }, [fetchRooms, fetchAgents, fetchTasks]);

  const pendingTasks = useMemo(() => tasks.filter((t) => !t.completed).slice(0, 3), [tasks]);
  const recentRooms = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3),
    [rooms]
  );
  const topAgents = useMemo(
    () => [...agents].sort((a, b) => b.message_count - a.message_count).slice(0, 4),
    [agents]
  );

  const stats = useMemo(
    () => [
      {
        label: t('home.stats.chats', 'Chats'),
        value: rooms.length,
        icon: 'chatbubbles' as IoniconsName,
      },
      {
        label: t('home.stats.agents', 'Agents'),
        value: agents.length,
        icon: 'people' as IoniconsName,
      },
      {
        label: t('home.stats.tasks', 'Tasks'),
        value: tasks.filter((t) => !t.completed).length,
        icon: 'checkbox' as IoniconsName,
      },
    ],
    [rooms.length, agents.length, tasks, t]
  );

  const sections: { type: HomeSection; key: string }[] = useMemo(() => {
    const list: { type: HomeSection; key: string }[] = [
      { type: 'header', key: 'header' },
      { type: 'quickActions', key: 'quickActions' },
    ];
    if (recentRooms.length > 0) list.push({ type: 'recentChats', key: 'recentChats' });
    if (tasks.length > 0) list.push({ type: 'tasks', key: 'tasks' });
    if (topAgents.length > 0) list.push({ type: 'agents', key: 'agents' });
    if (rooms.length === 0 && agents.length === 0 && tasks.length === 0 && !isLoadingRooms) {
      list.push({ type: 'empty', key: 'empty' });
    }
    return list;
  }, [
    recentRooms.length,
    tasks.length,
    topAgents.length,
    rooms.length,
    agents.length,
    isLoadingRooms,
  ]);

  const renderSection = useCallback(
    ({ item }: { item: { type: HomeSection; key: string } }) => {
      switch (item.type) {
        case 'header':
          return (
            <View style={styles.headerContainer}>
              <View style={styles.headerRow}>
                <View style={styles.greetingContainer}>
                  <AppText style={styles.greetingText}>
                    {getGreeting(new Date().getHours(), t)}
                  </AppText>
                  <AppText
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    style={styles.firstNameText}
                  >
                    {getFirstName(user?.email)}
                  </AppText>
                  <AppText style={styles.dateText}>{formatDate()}</AppText>
                </View>
                <TouchableOpacity
                  onPress={() => router.push('/(main)/settings')}
                  activeOpacity={0.75}
                  style={styles.avatarButton}
                >
                  <AppText style={styles.avatarText}>{getInitials(user?.email)}</AppText>
                </TouchableOpacity>
              </View>
              <View style={styles.statsBar}>
                {stats.map((stat, i) => (
                  <View
                    key={stat.label}
                    style={[
                      styles.statItem,
                      {
                        borderRightWidth: i < stats.length - 1 ? 1 : 0,
                        borderRightColor: C.border,
                      },
                    ]}
                  >
                    <View style={styles.statIconContainer}>
                      <Ionicons name={stat.icon} size={15} color={C.primary} />
                    </View>
                    <AppText style={styles.statValue}>{stat.value}</AppText>
                    <AppText style={styles.statLabel} numberOfLines={1}>
                      {stat.label}
                    </AppText>
                  </View>
                ))}
              </View>
            </View>
          );

        case 'quickActions':
          return (
            <View style={styles.card}>
              <SectionHeader title={t('home.sections.quick_actions', 'Quick Actions')} />
              <View style={styles.quickActionRow}>
                <QuickAction
                  icon="chatbubble-ellipses"
                  label={t('home.actions.new_chat', 'New Chat')}
                  onPress={() => setShowNewChat(true)}
                />
                <QuickAction
                  icon="person-add"
                  label={t('home.actions.new_agent', 'New Agent')}
                  onPress={() => router.push('/(main)/agents')}
                />
                <QuickAction
                  icon="document-text"
                  label={t('home.actions.new_note', 'New Note')}
                  onPress={() => router.push('/(main)/productivity')}
                />
                <QuickAction
                  icon="checkbox"
                  label={t('home.actions.new_task', 'New Task')}
                  onPress={() => router.push('/(main)/productivity')}
                />
              </View>
            </View>
          );

        case 'recentChats':
          return (
            <View style={styles.card}>
              <SectionHeader
                title={t('home.sections.recent_chats', 'Recent Chats')}
                actionLabel={t('home.actions.see_all', 'See All')}
                onAction={() => router.push('/(main)/chat')}
              />
              {recentRooms.map((room, index) => (
                <RecentChatRow
                  key={room.id}
                  room={room}
                  isLast={index === recentRooms.length - 1}
                  onPress={() => router.push(`/(main)/chat/${room.id}`)}
                />
              ))}
            </View>
          );

        case 'tasks':
          return (
            <View style={styles.card}>
              <SectionHeader
                title={
                  pendingTasks.length > 0
                    ? t('home.tasks.open_count', {
                        count: pendingTasks.length,
                        defaultValue: `${pendingTasks.length} open tasks`,
                      })
                    : t('home.tasks.all_done', 'All tasks done')
                }
                actionLabel={t('home.actions.see_all', 'See All')}
                onAction={() => router.push('/(main)/productivity')}
              />
              {pendingTasks.length === 0 ? (
                <View style={styles.emptyTasksContainer}>
                  <Ionicons
                    name="checkmark-circle"
                    size={32}
                    color={C.primary}
                    style={{ marginBottom: 8 }}
                  />
                  <AppText style={styles.emptyTasksText}>
                    {t('home.tasks.caught_up', "You're all caught up!")}
                  </AppText>
                </View>
              ) : (
                pendingTasks.map((task, index) => (
                  <TaskRow
                    key={task.id}
                    task={task}
                    isLast={index === pendingTasks.length - 1}
                    onToggle={() => useProductivityStore.getState().toggleTask(task.id)}
                  />
                ))
              )}
            </View>
          );

        case 'agents':
          return (
            <View style={styles.card}>
              <SectionHeader
                title={t('home.sections.your_agents', 'Your Agents')}
                actionLabel={t('home.actions.manage', 'Manage')}
                onAction={() => router.push('/(main)/agents')}
              />
              <View style={styles.agentsWrap}>
                {topAgents.map((agent) => (
                  <AgentChip
                    key={agent.id}
                    agent={agent}
                    onPress={() => router.push('/(main)/agents')}
                  />
                ))}
              </View>
            </View>
          );

        case 'empty':
          return (
            <View style={styles.emptyHomeContainer}>
              <View style={styles.emptyHomeIconBox}>
                <Ionicons name="sparkles" size={38} color={C.primary} />
              </View>
              <AppText style={styles.emptyHomeTitle}>
                {t('home.empty.title', 'Welcome to Miru')}
              </AppText>
              <AppText style={styles.emptyHomeDesc}>
                {t(
                  'home.empty.desc',
                  'Start a chat, create tasks, or build your first AI persona to get started.'
                )}
              </AppText>
              <TouchableOpacity onPress={() => setShowNewChat(true)} style={styles.startChatBtn}>
                <Ionicons name="add" size={19} color="white" style={{ marginRight: 7 }} />
                <AppText style={styles.startChatBtnText}>
                  {t('home.actions.start_chat', 'Start Chat')}
                </AppText>
              </TouchableOpacity>
            </View>
          );

        default:
          return null;
      }
    },
    [user?.email, t, stats, router, pendingTasks, recentRooms, topAgents]
  );

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={sections}
        keyExtractor={(item) => item.key}
        renderItem={renderSection}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isLoadingRooms}
            onRefresh={onRefresh}
            tintColor={C.primary}
          />
        }
      />

      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}

// --- Auto-added display names ---
SectionHeader.displayName = 'SectionHeader';
QuickAction.displayName = 'QuickAction';
RecentChatRow.displayName = 'RecentChatRow';
TaskRow.displayName = 'TaskRow';
AgentChip.displayName = 'AgentChip';
