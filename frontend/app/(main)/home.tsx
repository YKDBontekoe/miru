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
import { SkeletonAgentCard } from '@/components/SkeletonCard';

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
      <HomeRecentChatRow room={item} onPress={() => handleRecentRoomPress(item.id)} />
    ),
    [recentRooms.length, handleRecentRoomPress]
  );

  const renderTaskRow = React.useCallback(
    ({ item, index }: { item: Task; index: number }) => (
      <HomeTaskRow task={item} onToggle={() => toggleTask(item.id)} />
    ),
    [pendingTasks.length, toggleTask]
  );

  const renderAgentChip = React.useCallback(
    ({ item }: { item: Agent }) => <HomeAgentChip agent={item} onPress={handleAgentPress} />,
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
          <HomeCard>
            <HomeSectionHeader title={t('home.sections.quick_actions')} />
            <View
              style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' }}
            >
              <HomeQuickAction
                icon="chatbubble-ellipses"
                label={t('home.actions.new_chat')}
                onPress={() => setShowNewChat(true)}
              />
              <HomeQuickAction
                icon="person-add"
                label={t('home.actions.new_agent')}
                onPress={() => router.push('/(main)/agents')}
              />
              <HomeQuickAction
                icon="document-text"
                label={t('home.actions.new_note')}
                onPress={() => router.push('/(main)/productivity')}
              />
              <HomeQuickAction
                icon="checkbox"
                label={t('home.actions.new_task')}
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
              <FlatList
                data={topAgents}
                keyExtractor={(item) => item.id}
                scrollEnabled={false}
                numColumns={2}
                columnWrapperStyle={{ flexWrap: 'wrap' }}
                renderItem={renderAgentChip}
              />
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
