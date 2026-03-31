import React, { useEffect, useState } from 'react';
import { View, ScrollView, FlatList, RefreshControl, Platform } from 'react-native';
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

import {
  HomeCard,
  HomeSectionHeader,
  HomeQuickAction,
  HomeRecentChatRow,
  HomeTaskRow,
  HomeAgentChip,
  HomeNewChatModal,
} from '@/components/home';

// ─── Palette ──────────────────────────────────────────────────────────────────
const C = {
  bg: '#F4F6FF',
  surface: '#FFFFFF',
  surfaceHigh: '#EEF2FF',
  border: '#E6EAFF',
  text: '#0A0E2E',
  subtext: '#353A60',
  muted: '#606490',
  faint: '#B4BBDE',
  primary: '#2563EB',
  primaryLight: '#DBEAFE',
  primaryFaint: '#EEF4FF',
};

// ─── Quick action definitions ──────────────────────────────────────────────────
const ACTION_COLORS = {
  chat: { color: '#2563EB', bg: '#EEF4FF', iconBg: '#DBEAFE' },
  agent: { color: '#7C3AED', bg: '#F5F3FF', iconBg: '#EDE9FE' },
  note: { color: '#D97706', bg: '#FFFBEB', iconBg: '#FEF3C7' },
  task: { color: '#059669', bg: '#ECFDF5', iconBg: '#D1FAE5' },
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

// ─── Main screen ──────────────────────────────────────────────────────────────
export default function HomeScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms, createRoom, addAgentToRoom } = useChatStore();
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
  const handleAgentChipPress = React.useCallback(
    async (agent: Agent) => {
      try {
        const room = await createRoom(`Chat with ${agent.name}`);
        await addAgentToRoom(room.id, agent.id);
        router.push(`/(main)/chat/${room.id}`);
      } catch {
        router.push('/(main)/agents');
      }
    },
    [createRoom, addAgentToRoom, router]
  );

  const renderRecentChatRow = React.useCallback(
    ({ item }: { item: ChatRoom }) => (
      <HomeRecentChatRow room={item} onPress={() => handleRecentRoomPress(item.id)} />
    ),
    [handleRecentRoomPress]
  );

  const renderTaskRow = React.useCallback(
    ({ item }: { item: Task }) => <HomeTaskRow task={item} onToggle={() => toggleTask(item.id)} />,
    [toggleTask]
  );

  useEffect(() => {
    Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
  }, [fetchRooms, fetchAgents, fetchTasks]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRooms(), fetchAgents(), fetchTasks()]);
    setRefreshing(false);
  };

  // ── Skeleton loading ──────────────────────────────────────────────────────
  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
        {/* Skeleton hero card */}
        <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 12 }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 28,
              overflow: 'hidden',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.08,
              shadowRadius: 20,
              elevation: 4,
            }}
          >
            <View style={{ height: 4, backgroundColor: C.surfaceHigh }} />
            <View style={{ padding: 20 }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  marginBottom: 20,
                }}
              >
                <View>
                  <View
                    style={{
                      width: 110,
                      height: 13,
                      backgroundColor: C.surfaceHigh,
                      borderRadius: 6,
                      marginBottom: 10,
                    }}
                  />
                  <View
                    style={{
                      width: 160,
                      height: 34,
                      backgroundColor: C.surfaceHigh,
                      borderRadius: 10,
                      marginBottom: 12,
                    }}
                  />
                  <View
                    style={{
                      width: 130,
                      height: 26,
                      backgroundColor: C.surfaceHigh,
                      borderRadius: 13,
                    }}
                  />
                </View>
                <View
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: C.surfaceHigh,
                  }}
                />
              </View>
              <View style={{ height: 1, backgroundColor: C.border, marginBottom: 16 }} />
              <View style={{ flexDirection: 'row' }}>
                {[0, 1, 2].map((i) => (
                  <View
                    key={i}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      borderRightWidth: i < 2 ? 1 : 0,
                      borderRightColor: C.border,
                    }}
                  >
                    <View
                      style={{
                        width: 36,
                        height: 26,
                        backgroundColor: C.surfaceHigh,
                        borderRadius: 8,
                        marginBottom: 6,
                      }}
                    />
                    <View
                      style={{
                        width: 28,
                        height: 11,
                        backgroundColor: C.surfaceHigh,
                        borderRadius: 5,
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* Skeleton body cards */}
        <View style={{ paddingHorizontal: 16, gap: 12 }}>
          {[100, 80, 60].map((w, i) => (
            <View
              key={i}
              style={{
                backgroundColor: C.surface,
                borderRadius: 20,
                padding: 20,
                height: 80 + i * 20,
                shadowColor: '#2563EB',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.05,
                shadowRadius: 12,
                elevation: 2,
              }}
            />
          ))}
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
        {/* ── Hero card ──────────────────────────────────────────────── */}
        <View style={{ marginHorizontal: 16, marginTop: 12, marginBottom: 4 }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderRadius: 28,
              overflow: 'hidden',
              shadowColor: '#2563EB',
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.1,
              shadowRadius: 20,
              elevation: 5,
            }}
          >
            {/* Blue accent bar */}
            <View style={{ height: 4, backgroundColor: C.primary }} />

            <View style={{ padding: 20 }}>
              {/* Greeting row */}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  marginBottom: 18,
                }}
              >
                <View style={{ flex: 1, paddingRight: 14 }}>
                  <AppText
                    style={{ fontSize: 13, color: C.muted, fontWeight: '500', marginBottom: 4 }}
                  >
                    {greeting}
                  </AppText>
                  <AppText
                    adjustsFontSizeToFit
                    minimumFontScale={0.7}
                    numberOfLines={1}
                    style={{
                      fontSize: 34,
                      fontWeight: '800',
                      color: C.text,
                      letterSpacing: -1.2,
                      lineHeight: 40,
                    }}
                  >
                    {firstName}
                  </AppText>
                  {/* Date pill */}
                  <View style={{ flexDirection: 'row', marginTop: 10 }}>
                    <View
                      style={{
                        backgroundColor: C.primaryFaint,
                        borderRadius: 10,
                        paddingHorizontal: 10,
                        paddingVertical: 5,
                        flexDirection: 'row',
                        alignItems: 'center',
                        gap: 5,
                      }}
                    >
                      <Ionicons name="calendar-outline" size={11} color={C.primary} />
                      <AppText style={{ fontSize: 12, color: C.primary, fontWeight: '600' }}>
                        {formatDate()}
                      </AppText>
                    </View>
                  </View>
                </View>

                {/* Avatar */}
                <ScalePressable
                  onPress={() => router.push('/(main)/settings')}
                  style={{
                    width: 54,
                    height: 54,
                    borderRadius: 27,
                    backgroundColor: C.primary,
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: C.primary,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.3,
                    shadowRadius: 8,
                    elevation: 6,
                  }}
                >
                  <AppText
                    style={{
                      color: '#FFFFFF',
                      fontWeight: '800',
                      fontSize: 17,
                      letterSpacing: 0.5,
                    }}
                  >
                    {initials}
                  </AppText>
                </ScalePressable>
              </View>

              {/* Divider */}
              <View style={{ height: 1, backgroundColor: C.border, marginBottom: 16 }} />

              {/* Stats row */}
              <View style={{ flexDirection: 'row' }}>
                {stats.map((stat, i) => (
                  <View
                    key={stat.label}
                    style={{
                      flex: 1,
                      alignItems: 'center',
                      borderRightWidth: i < stats.length - 1 ? 1 : 0,
                      borderRightColor: C.border,
                    }}
                  >
                    <AppText
                      style={{
                        fontSize: 28,
                        fontWeight: '800',
                        color: C.text,
                        letterSpacing: -0.5,
                      }}
                    >
                      {stat.value}
                    </AppText>
                    <View
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 3 }}
                    >
                      <Ionicons name={stat.icon} size={11} color={C.muted} />
                      <AppText
                        style={{ fontSize: 11, color: C.muted, fontWeight: '500' }}
                        numberOfLines={1}
                      >
                        {stat.label}
                      </AppText>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>
        </View>

        {/* ── Body ────────────────────────────────────────────────────── */}
        <View style={{ paddingHorizontal: 16, marginTop: 12 }}>
          {/* Quick actions — color-coded */}
          <HomeCard>
            <HomeSectionHeader title={t('home.sections.quick_actions')} />
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
            >
              <HomeQuickAction
                icon="chatbubble-ellipses"
                label={t('home.actions.new_chat')}
                color={ACTION_COLORS.chat.color}
                bgColor={ACTION_COLORS.chat.bg}
                iconBgColor={ACTION_COLORS.chat.iconBg}
                onPress={() => setShowNewChat(true)}
              />
              <HomeQuickAction
                icon="person-add"
                label={t('home.actions.new_agent')}
                color={ACTION_COLORS.agent.color}
                bgColor={ACTION_COLORS.agent.bg}
                iconBgColor={ACTION_COLORS.agent.iconBg}
                onPress={() => router.push('/(main)/agents')}
              />
              <HomeQuickAction
                icon="document-text"
                label={t('home.actions.new_note')}
                color={ACTION_COLORS.note.color}
                bgColor={ACTION_COLORS.note.bg}
                iconBgColor={ACTION_COLORS.note.iconBg}
                onPress={() => router.push('/(main)/productivity')}
              />
              <HomeQuickAction
                icon="checkbox"
                label={t('home.actions.new_task')}
                color={ACTION_COLORS.task.color}
                bgColor={ACTION_COLORS.task.bg}
                iconBgColor={ACTION_COLORS.task.iconBg}
                onPress={() => router.push('/(main)/productivity')}
              />
            </View>
          </HomeCard>

          {/* Recent chats */}
          {recentRooms.length > 0 && (
            <HomeCard>
              <HomeSectionHeader
                title={t('home.sections.recent_chats')}
                actionLabel={t('home.actions.see_all')}
                onAction={() => router.push('/(main)/chat')}
              />
              <FlatList
                data={recentRooms}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                renderItem={renderRecentChatRow}
                ItemSeparatorComponent={() => (
                  <View style={{ height: 1, backgroundColor: C.border, marginLeft: 54 }} />
                )}
              />
            </HomeCard>
          )}

          {/* Tasks */}
          {tasks.length > 0 && (
            <HomeCard>
              <HomeSectionHeader
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
                    color={ACTION_COLORS.task.color}
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
                  ItemSeparatorComponent={() => (
                    <View style={{ height: 1, backgroundColor: C.border, marginLeft: 36 }} />
                  )}
                />
              )}
            </HomeCard>
          )}

          {/* Agents */}
          {topAgents.length > 0 && (
            <HomeCard>
              <HomeSectionHeader
                title={t('home.sections.your_agents')}
                actionLabel={t('home.actions.manage')}
                onAction={() => router.push('/(main)/agents')}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {topAgents.map((agent) => (
                  <HomeAgentChip
                    key={agent.id}
                    agent={agent}
                    onPress={() => handleAgentChipPress(agent)}
                  />
                ))}
              </View>
            </HomeCard>
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

      <HomeNewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}
