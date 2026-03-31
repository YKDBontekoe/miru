import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Platform,
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
import { ScalePressable } from '@/components/ScalePressable';
import { SkeletonAgentCard } from '@/components/SkeletonCard';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F4F6FF',
  surface: '#FFFFFF',
  surfaceHigh: '#EEF2FF',
  border: '#E6EAFF',
  text: '#0A0E2E',
  muted: '#606490',
  faint: '#B4BBDE',
  primary: '#2563EB',
  primaryMid: '#3B82F6',
  primaryLight: '#DBEAFE',
  primaryFaint: '#EEF4FF',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getGreeting(hour: number, t: (k: string) => string): string {
  if (hour < 12) return t('home.greeting.morning');
  if (hour < 17) return t('home.greeting.afternoon');
  return t('home.greeting.evening');
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

// ─── Card ─────────────────────────────────────────────────────────────────────
function Card({ children }: { children: React.ReactNode }) {
  return (
    <View
      style={{
        backgroundColor: C.surface,
        borderRadius: 24,
        padding: 20,
        marginBottom: 12,
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.07,
        shadowRadius: 20,
        elevation: 3,
      }}
    >
      {children}
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
      }}
    >
      <AppText
        style={{
          fontSize: 15,
          fontWeight: '700',
          color: C.text,
          letterSpacing: -0.2,
        }}
      >
        {title}
      </AppText>
      {actionLabel && onAction && (
        <ScalePressable onPress={onAction}>
          <AppText style={{ fontSize: 13, color: C.primary, fontWeight: '600' }}>
            {actionLabel}
          </AppText>
        </ScalePressable>
      )}
    </View>
  );
}

// ─── Quick-action tile ────────────────────────────────────────────────────────
function QuickAction({
  icon,
  label,
  onPress,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
}) {
  return (
    <ScalePressable onPress={onPress} style={{ width: '48%', marginBottom: 10 }}>
      <View
        style={{
          backgroundColor: C.primaryFaint,
          borderRadius: 20,
          paddingVertical: 20,
          paddingHorizontal: 12,
          alignItems: 'center',
        }}
      >
        <View
          style={{
            width: 46,
            height: 46,
            borderRadius: 15,
            backgroundColor: C.primaryLight,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 10,
          }}
        >
          <Ionicons name={icon} size={22} color={C.primary} />
        </View>
        <AppText
          style={{ fontSize: 13, fontWeight: '600', color: C.text, textAlign: 'center' }}
          numberOfLines={1}
        >
          {label}
        </AppText>
      </View>
    </ScalePressable>
  );
}

// ─── Recent chat row ──────────────────────────────────────────────────────────
const RecentChatRow = React.memo(function RecentChatRow({
  room,
  onPress,
  isLast,
}: {
  room: ChatRoom;
  onPress: () => void;
  isLast: boolean;
}) {
  const { t } = useTranslation();
  const initial = room.name[0]?.toUpperCase() ?? '?';

  const relativeTimeStr = React.useMemo(() => {
    const diff = Date.now() - new Date(room.updated_at).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return t('home.time.minutes_ago_one', { count: mins });
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return t('home.time.hours_ago_one', { count: hrs });
    return t('home.time.days_ago_one', { count: Math.floor(hrs / 24) });
  }, [t, room.updated_at]);

  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: C.primaryFaint,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 15, fontWeight: '700' }}>{initial}</AppText>
      </View>
      <View style={{ flex: 1, marginRight: 8 }}>
        <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }} numberOfLines={1}>
          {room.name}
        </AppText>
        <AppText style={{ fontSize: 12, color: C.muted, marginTop: 2 }} numberOfLines={1}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText style={{ fontSize: 11, color: C.faint, marginBottom: 4 }}>
          {relativeTimeStr}
        </AppText>
        <Ionicons name="chevron-forward" size={13} color={C.faint} />
      </View>
    </ScalePressable>
  );
});

// ─── Task row ─────────────────────────────────────────────────────────────────
const TaskRow = React.memo(function TaskRow({
  task,
  onToggle,
  isLast,
}: {
  task: Task;
  onToggle: () => void;
  isLast: boolean;
}) {
  const { i18n } = useTranslation();
  return (
    <ScalePressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 10,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: task.completed ? C.primary : C.faint,
          backgroundColor: task.completed ? C.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 12,
        }}
      >
        {task.completed && <Ionicons name="checkmark" size={13} color="white" />}
      </View>
      <AppText
        style={{
          flex: 1,
          fontSize: 14,
          color: task.completed ? C.faint : C.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
        }}
        numberOfLines={1}
      >
        {task.title}
      </AppText>
      {task.due_date && (
        <View
          style={{
            backgroundColor: C.primaryFaint,
            borderRadius: 8,
            paddingHorizontal: 8,
            paddingVertical: 3,
            marginLeft: 8,
          }}
        >
          <AppText style={{ fontSize: 11, color: C.primary, fontWeight: '600' }}>
            {new Intl.DateTimeFormat(i18n.language, { month: 'short', day: 'numeric' }).format(
              new Date(task.due_date)
            )}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
});

// ─── Agent chip ───────────────────────────────────────────────────────────────
const AgentChip = React.memo(function AgentChip({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: C.primaryFaint,
        borderRadius: 22,
        paddingVertical: 7,
        paddingHorizontal: 12,
        marginRight: 8,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: C.primaryLight,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 7,
        }}
      >
        <AppText style={{ color: C.primary, fontSize: 12, fontWeight: '700' }}>
          {agent.name[0].toUpperCase()}
        </AppText>
      </View>
      <AppText style={{ fontSize: 13, fontWeight: '600', color: C.text }}>{agent.name}</AppText>
      {agent.message_count > 0 && (
        <View
          style={{
            backgroundColor: C.primary,
            borderRadius: 9,
            minWidth: 18,
            height: 18,
            paddingHorizontal: 5,
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 7,
          }}
        >
          <AppText style={{ fontSize: 10, color: 'white', fontWeight: '700' }}>
            {agent.message_count}
          </AppText>
        </View>
      )}
    </ScalePressable>
  );
});

// ─── New-chat modal ───────────────────────────────────────────────────────────
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

  const handleCreate = async () => {
    if (!name.trim()) {
      Alert.alert(t('home.chat_modal.name_required'), t('home.chat_modal.please_enter_name'));
      return;
    }
    setIsSaving(true);
    try {
      await createRoom(name.trim());
      setName('');
      onCreated();
      onClose();
    } catch {
      Alert.alert(t('home.chat_modal.error'), t('home.chat_modal.failed_to_create'));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(10,15,46,0.4)' }}>
        <View
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 28,
            borderTopRightRadius: 28,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              backgroundColor: C.surfaceHigh,
              alignSelf: 'center',
              marginBottom: 20,
            }}
          />
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 18,
            }}
          >
            <AppText variant="h2" style={{ color: C.text }}>
              {t('home.chat_modal.title')}
            </AppText>
            <ScalePressable
              onPress={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 15,
                backgroundColor: C.surfaceHigh,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name="close" size={17} color={C.muted} />
            </ScalePressable>
          </View>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t('home.chat_modal.placeholder')}
            placeholderTextColor={C.faint}
            autoFocus
            style={{
              backgroundColor: C.surfaceHigh,
              borderRadius: 16,
              paddingHorizontal: 16,
              paddingVertical: 14,
              color: C.text,
              fontSize: 16,
              marginBottom: 14,
            }}
          />
          <ScalePressable
            onPress={handleCreate}
            disabled={isSaving}
            style={{
              backgroundColor: isSaving ? `${C.primary}70` : C.primary,
              borderRadius: 14,
              paddingVertical: 15,
              alignItems: 'center',
              shadowColor: C.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.22,
              shadowRadius: 8,
              elevation: 4,
            }}
          >
            {isSaving ? (
              <ActivityIndicator color="white" />
            ) : (
              <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                {t('home.actions.create')}
              </AppText>
            )}
          </ScalePressable>
        </View>
      </View>
    </Modal>
  );
}

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const { tasks, fetchTasks, toggleTask } = useProductivityStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const hour = new Date().getHours();
  const greeting = getGreeting(hour, t);
  const firstName = getFirstName(user?.email);
  const initials = getInitials(user?.email);

  const recentRooms = React.useMemo(() => {
    return [...rooms]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 3);
  }, [rooms]);

  const { pendingTasks, completedCount } = React.useMemo(() => {
    const pending = tasks.filter((task) => !task.completed);
    return {
      pendingTasks: pending.slice(0, 4),
      completedCount: tasks.length - pending.length,
    };
  }, [tasks]);

  const topAgents = React.useMemo(() => agents.slice(0, 6), [agents]);

  const handleRecentRoomPress = React.useCallback(
    (id: string) => router.push(`/(main)/chat/${id}`),
    [router]
  );
  const handleAgentPress = React.useCallback(() => router.push('/(main)/agents'), [router]);

  const renderRecentChatRow = React.useCallback(
    ({ item, index }: { item: ChatRoom; index: number }) => (
      <RecentChatRow
        room={item}
        isLast={index === recentRooms.length - 1}
        onPress={() => handleRecentRoomPress(item.id)}
      />
    ),
    [recentRooms.length, handleRecentRoomPress]
  );

  const renderTaskRow = React.useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <TaskRow
        task={item}
        isLast={index === pendingTasks.length - 1}
        onToggle={() => toggleTask(item.id)}
      />
    ),
    [pendingTasks.length, toggleTask]
  );

  const renderAgentChip = React.useCallback(
    ({ item }: { item: Agent }) => <AgentChip agent={item} onPress={handleAgentPress} />,
    [handleAgentPress]
  );

  useEffect(() => {
    Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
  }, [fetchRooms, fetchAgents, fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
    setRefreshing(false);
  };

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 10,
            paddingBottom: 24,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <View>
            <View
              style={{
                width: 120,
                height: 24,
                backgroundColor: C.surfaceHigh,
                borderRadius: 12,
                marginBottom: 8,
              }}
            />
            <View
              style={{ width: 180, height: 28, backgroundColor: C.surfaceHigh, borderRadius: 14 }}
            />
          </View>
          <View
            style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.surfaceHigh }}
          />
        </View>
        <View style={{ paddingHorizontal: 20 }}>
          <SkeletonAgentCard index={0} />
          <SkeletonAgentCard index={1} />
          <SkeletonAgentCard index={2} />
        </View>
      </SafeAreaView>
    );
  }

  const stats = [
    { value: rooms.length, label: t('home.actions.chats'), icon: 'chatbubbles' as const },
    { value: agents.length, label: t('home.actions.agents'), icon: 'people' as const },
    { value: completedCount, label: t('home.actions.done'), icon: 'checkmark-circle' as const },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={{ paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 64 }}
      >
        {/* ── Header ──────────────────────────────────────────────────── */}
        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 20,
            paddingBottom: 16,
          }}
        >
          {/* Greeting row */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              marginBottom: 20,
            }}
          >
            <View style={{ flex: 1, paddingRight: 16 }}>
              <AppText style={{ fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 4 }}>
                {greeting}
              </AppText>
              <AppText
                adjustsFontSizeToFit
                minimumFontScale={0.7}
                numberOfLines={1}
                style={{
                  fontSize: 30,
                  fontWeight: '800',
                  color: C.text,
                  letterSpacing: -1,
                  lineHeight: 36,
                }}
              >
                {firstName}
              </AppText>
              <AppText style={{ fontSize: 13, color: C.faint, marginTop: 5 }}>
                {formatDate()}
              </AppText>
            </View>

            {/* Avatar — clean circle, initials only */}
            <ScalePressable
              onPress={() => router.push('/(main)/settings')}
              style={{
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
              }}
            >
              <AppText
                style={{ color: '#FFFFFF', fontWeight: '800', fontSize: 15, letterSpacing: 0.5 }}
              >
                {initials}
              </AppText>
            </ScalePressable>
          </View>

          {/* Stats bar */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {stats.map((stat) => (
              <View
                key={stat.label}
                style={{
                  flex: 1,
                  alignItems: 'center',
                  backgroundColor: C.surface,
                  borderRadius: 20,
                  paddingVertical: 14,
                  shadowColor: '#2563EB',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.06,
                  shadowRadius: 12,
                  elevation: 2,
                }}
              >
                <View
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: 11,
                    backgroundColor: C.primaryFaint,
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: 7,
                  }}
                >
                  <Ionicons name={stat.icon} size={16} color={C.primary} />
                </View>
                <AppText
                  style={{ fontSize: 22, fontWeight: '800', color: C.text, letterSpacing: -0.5 }}
                >
                  {stat.value}
                </AppText>
                <AppText
                  style={{ fontSize: 11, color: C.muted, fontWeight: '500', marginTop: 2 }}
                  numberOfLines={1}
                >
                  {stat.label}
                </AppText>
              </View>
            ))}
          </View>
        </View>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16 }}>
          {/* Quick actions */}
          <Card>
            <SectionHeader title={t('home.sections.quick_actions')} />
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
            >
              <QuickAction
                icon="chatbubble-ellipses"
                label={t('home.actions.new_chat')}
                onPress={() => setShowNewChat(true)}
              />
              <QuickAction
                icon="person-add"
                label={t('home.actions.new_agent')}
                onPress={() => router.push('/(main)/agents')}
              />
              <QuickAction
                icon="document-text"
                label={t('home.actions.new_note')}
                onPress={() => router.push('/(main)/productivity')}
              />
              <QuickAction
                icon="checkbox"
                label={t('home.actions.new_task')}
                onPress={() => router.push('/(main)/productivity')}
              />
            </View>
          </Card>

          {/* Recent chats */}
          {recentRooms.length > 0 && (
            <Card>
              <SectionHeader
                title={t('home.sections.recent_chats')}
                actionLabel={t('home.actions.see_all')}
                onAction={() => router.push('/(main)/chat')}
              />
              <FlatList
                data={recentRooms}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={renderRecentChatRow}
              />
            </Card>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <Card>
              <SectionHeader
                title={
                  pendingTasks.length > 0
                    ? t('home.tasks.open_count', { count: pendingTasks.length })
                    : t('home.tasks.all_done')
                }
                actionLabel={t('home.actions.see_all')}
                onAction={() => router.push('/(main)/productivity')}
              />
              {pendingTasks.length === 0 ? (
                <View style={{ alignItems: 'center', paddingVertical: 14 }}>
                  <Ionicons
                    name="checkmark-circle"
                    size={32}
                    color={C.primary}
                    style={{ marginBottom: 8 }}
                  />
                  <AppText style={{ color: C.muted, fontSize: 14 }}>
                    {t('home.tasks.caught_up')}
                  </AppText>
                </View>
              ) : (
                <FlatList
                  data={pendingTasks}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={renderTaskRow}
                />
              )}
            </Card>
          )}

          {/* Agents */}
          {topAgents.length > 0 && (
            <Card>
              <SectionHeader
                title={t('home.sections.your_agents')}
                actionLabel={t('home.actions.manage')}
                onAction={() => router.push('/(main)/agents')}
              />
              <FlatList
                data={topAgents}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={{ flexWrap: 'wrap' }}
                renderItem={renderAgentChip}
              />
            </Card>
          )}

          {/* Empty state */}
          {rooms.length === 0 && agents.length === 0 && tasks.length === 0 && !isLoadingRooms && (
            <View style={{ alignItems: 'center', paddingTop: 40, paddingBottom: 48 }}>
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 28,
                  backgroundColor: C.primaryFaint,
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 18,
                }}
              >
                <Ionicons name="sparkles" size={38} color={C.primary} />
              </View>
              <AppText
                style={{
                  fontSize: 20,
                  fontWeight: '800',
                  color: C.text,
                  marginBottom: 8,
                  textAlign: 'center',
                  letterSpacing: -0.3,
                }}
              >
                {t('home.empty.title')}
              </AppText>
              <AppText
                style={{
                  textAlign: 'center',
                  color: C.muted,
                  paddingHorizontal: 32,
                  marginBottom: 28,
                  lineHeight: 22,
                  fontSize: 14,
                }}
              >
                {t('home.empty.desc')}
              </AppText>
              <ScalePressable
                onPress={() => setShowNewChat(true)}
                style={{
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
                }}
              >
                <Ionicons name="add" size={19} color="white" style={{ marginRight: 7 }} />
                <AppText style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>
                  {t('home.actions.start_chat')}
                </AppText>
              </ScalePressable>
            </View>
          )}
        </View>
      </ScrollView>

      <NewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}
