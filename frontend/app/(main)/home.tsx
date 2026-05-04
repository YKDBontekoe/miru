import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import {
  HomeActionTile,
  HomeAgentBadge,
  HomeChatRow,
  HomeHeroCard,
  HomeSectionHeader,
  HomeSurfaceCard,
  HomeTaskRow,
} from '@/components/home/HomeDashboardParts';
import { HomeNewChatModal } from '@/components/home';
import { formatDate, formatTimeRange, getFirstName, getGreeting, getInitials, isSameDay } from '@/components/home/homeUtils';
import { useAgentStore } from '../../src/store/useAgentStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { useTheme } from '@/hooks/useTheme';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { C } = useTheme();

  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms, hubError } = useChatStore();
  const { agents, fetchAgents, error: agentError } = useAgentStore();
  const { tasks, events, fetchTasks, fetchEvents, toggleTask, error: productivityError } = useProductivityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const hour = new Date().getHours();
  const greeting = getGreeting(hour, t);
  const firstName = getFirstName(user?.email);
  const initials = getInitials(user?.email);

  const combinedError = hubError || agentError || productivityError;

  const recentRooms = useMemo(
    () =>
      [...rooms]
        .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
        .slice(0, 3),
    [rooms]
  );

  const sortedPendingTasks = useMemo(
    () =>
      [...tasks]
        .filter((task) => !task.completed)
        .sort((a, b) => {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }),
    [tasks]
  );

  const todayTaskCount = useMemo(() => {
    const now = new Date();
    return tasks.filter((task) => {
      if (!task.due_date || task.completed) return false;
      const due = new Date(task.due_date);
      return !isNaN(due.getTime()) && isSameDay(now, due);
    }).length;
  }, [tasks]);

  const upcomingEvents = useMemo(() => {
    const now = new Date();
    return [...events]
      .filter((event) => {
        const end = new Date(event.end_time);
        const start = new Date(event.start_time);
        if (isNaN(end.getTime()) || isNaN(start.getTime())) return false;
        return end.getTime() >= Date.now() - 15 * 60 * 1000 && isSameDay(start, now);
      })
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())
      .slice(0, 3);
  }, [events]);

  const completedCount = tasks.length - sortedPendingTasks.length;
  const completionRate = tasks.length === 0 ? 0 : Math.round((completedCount / tasks.length) * 100);

  useEffect(() => {
    Promise.all([fetchRooms(), fetchAgents(), fetchTasks(), fetchEvents()]);
  }, [fetchRooms, fetchAgents, fetchTasks, fetchEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([fetchRooms(), fetchAgents(), fetchTasks(), fetchEvents()]);
    setRefreshing(false);
  };

  const handleToggleTask = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTask(id);
  };

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: C.bg }} className="flex-1">
        <View className="px-4 pt-4">
          <View style={{ backgroundColor: C.surfaceHigh }} className="mb-4 h-[180px] rounded-[24px] shadow-md dark:shadow-none" />
          <View className="mb-4 flex-row flex-wrap justify-between">
            <View style={{ backgroundColor: C.surfaceHigh }} className="mb-2 h-20 w-[48.5%] rounded-2xl" />
            <View style={{ backgroundColor: C.surfaceHigh }} className="mb-2 h-20 w-[48.5%] rounded-2xl" />
            <View style={{ backgroundColor: C.surfaceHigh }} className="mb-2 h-20 w-[48.5%] rounded-2xl" />
            <View style={{ backgroundColor: C.surfaceHigh }} className="mb-2 h-20 w-[48.5%] rounded-2xl" />
          </View>
          <View style={{ backgroundColor: C.surfaceHigh }} className="mb-4 h-[220px] rounded-[24px] shadow-md dark:shadow-none" />
        </View>
      </SafeAreaView>
    );
  }

  if (combinedError && rooms.length === 0 && agents.length === 0 && tasks.length === 0) {
    return (
      <SafeAreaView style={{ backgroundColor: C.bg }} className="flex-1">
        <View className="flex-1 justify-center px-4 pt-4">
          <View style={{ backgroundColor: C.surfaceHigh }} className="items-center rounded-2xl p-6">
            <Ionicons name="alert-circle-outline" size={48} color={C.danger} className="mb-3" />
            <AppText variant="h3" style={{ color: C.text }} className="mb-2 text-center">
              Failed to load dashboard
            </AppText>
            <AppText variant="bodySm" style={{ color: C.muted }} className="mb-4 text-center">
              {combinedError}
            </AppText>
            <ScalePressable
              onPress={onRefresh}
              style={{ backgroundColor: C.primary }}
              className="flex-row items-center rounded-2xl px-4 py-3"
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" className="mr-1" />
              <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                Retry
              </AppText>
            </ScalePressable>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ backgroundColor: C.bg }} className="flex-1">
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={{
          paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 70,
        }}
      >
        <View className="px-4 pt-4">
          <HomeHeroCard
            greeting={greeting}
            firstName={firstName}
            dateText={formatDate(new Date(), i18n.language)}
            initials={initials}
            todayTaskCount={todayTaskCount}
            completionRate={completionRate}
            onSettingsPress={() => router.push('/(main)/settings')}
            t={t}
          />

          <HomeSurfaceCard>
            <HomeSectionHeader
              title={t('home.sections.quick_actions')}
              actionLabel={t('home.actions.see_all')}
              onAction={() => router.push('/(main)/productivity')}
            />
            <View className="flex-row flex-wrap justify-between">
              <HomeActionTile
                icon="chatbubble-ellipses"
                label={t('home.actions.new_chat')}
                onPress={() => setShowNewChat(true)}
              />
              <HomeActionTile
                icon="people"
                label={t('home.actions.new_agent')}
                onPress={() => router.push('/(main)/agents')}
              />
              <HomeActionTile
                icon="checkbox"
                label={t('home.actions.new_task')}
                onPress={() => router.push('/(main)/productivity')}
              />
              <HomeActionTile
                icon="document-text"
                label={t('home.actions.new_note')}
                onPress={() => router.push('/(main)/productivity')}
              />
            </View>
          </HomeSurfaceCard>

          <HomeSurfaceCard>
            <HomeSectionHeader
              title={t('home.sections.focus_board', { defaultValue: 'Focus board' })}
              actionLabel={t('home.actions.manage')}
              onAction={() => router.push('/(main)/productivity')}
            />
            <View className="mb-2.5">
              <View style={{ backgroundColor: C.surfaceHigh }} className="mb-2.5 h-2 overflow-hidden rounded-sm">
                <View
                  style={{
                    width: `${completionRate}%`,
                    backgroundColor: C.primary,
                  }}
                  className="h-2 rounded-sm"
                />
              </View>
              <View className="flex-row justify-between">
                <AppText variant="caption" style={{ color: C.muted }}>
                  {t('home.focus.completed', { count: completedCount, defaultValue: '{{count}} completed' })}
                </AppText>
                <AppText variant="caption" style={{ color: C.muted }}>
                  {t('home.focus.remaining', {
                    count: sortedPendingTasks.length,
                    defaultValue: '{{count}} remaining',
                  })}
                </AppText>
              </View>
            </View>

            {sortedPendingTasks.length === 0 ? (
              <View style={{ backgroundColor: C.primarySurface }} className="flex-row items-center rounded-2xl p-3">
                <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                <AppText variant="bodySm" style={{ color: C.text }} className="ml-2 font-semibold">
                  {t('home.tasks.caught_up')}
                </AppText>
              </View>
            ) : (
              sortedPendingTasks
                .slice(0, 4)
                .map((task) => <HomeTaskRow key={task.id} task={task} onToggle={() => handleToggleTask(task.id)} />)
            )}
          </HomeSurfaceCard>

          <HomeSurfaceCard>
            <HomeSectionHeader
              title={t('home.sections.today_timeline', { defaultValue: 'Today timeline' })}
              actionLabel={t('home.actions.see_all')}
              onAction={() => router.push('/(main)/productivity')}
            />
            {upcomingEvents.length === 0 ? (
              <View style={{ backgroundColor: C.dangerSurface }} className="flex-row items-center rounded-2xl p-3">
                <Ionicons name="sunny" size={18} color={C.danger} />
                <AppText variant="bodySm" style={{ color: C.danger }} className="ml-2 font-semibold">
                  {t('home.events.none', { defaultValue: 'No upcoming events' })}
                </AppText>
              </View>
            ) : (
              upcomingEvents.map((event) => (
                <View key={event.id} style={{ backgroundColor: C.surfaceHigh }} className="mb-2 rounded-2xl p-3">
                  <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }} numberOfLines={1}>
                    {event.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: C.muted }} className="mt-1">
                    {formatTimeRange(event, i18n.language)}
                    {event.location ? ` · ${event.location}` : ''}
                  </AppText>
                </View>
              ))
            )}
          </HomeSurfaceCard>

          {recentRooms.length > 0 ? (
            <HomeSurfaceCard>
              <HomeSectionHeader
                title={t('home.sections.recent_chats')}
                actionLabel={t('home.actions.see_all')}
                onAction={() => router.push('/(main)/chat')}
              />
              {recentRooms.map((room) => (
                <HomeChatRow
                  key={room.id}
                  room={room}
                  onPress={() => router.push(`/(main)/chat/${room.id}`)}
                  t={t}
                />
              ))}
            </HomeSurfaceCard>
          ) : null}

          {agents.length > 0 ? (
            <HomeSurfaceCard>
              <HomeSectionHeader
                title={t('home.sections.your_agents')}
                actionLabel={t('home.actions.manage')}
                onAction={() => router.push('/(main)/agents')}
              />
              <View className="flex-row flex-wrap justify-between">
                {agents
                  .slice(0, 4)
                  .map((agent) => (
                    <HomeAgentBadge
                      key={agent.id}
                      agent={agent}
                      onPress={() => router.push('/(main)/agents')}
                    />
                  ))}
              </View>
            </HomeSurfaceCard>
          ) : null}

          {rooms.length === 0 && agents.length === 0 && tasks.length === 0 && !isLoadingRooms ? (
            <HomeSurfaceCard style={{ backgroundColor: C.surfaceHigh }}>
              <View className="items-center py-4">
                <View style={{ backgroundColor: C.primarySurface }} className="mb-3 h-[76px] w-[76px] items-center justify-center rounded-[26px]">
                  <Ionicons name="sparkles" size={30} color={C.primary} />
                </View>
                <AppText variant="h2" style={{ color: C.text }} className="mb-2 text-center">
                  {t('home.empty.title')}
                </AppText>
                <AppText variant="bodySm" style={{ color: C.muted }} className="mb-4 text-center leading-5">
                  {t('home.empty.desc')}
                </AppText>
                <ScalePressable
                  onPress={() => setShowNewChat(true)}
                  style={{ backgroundColor: C.primary }}
                  className="flex-row items-center rounded-2xl px-4 py-3"
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" className="mr-1.5" />
                  <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
                    {t('home.actions.start_chat')}
                  </AppText>
                </ScalePressable>
              </View>
            </HomeSurfaceCard>
          ) : null}
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
