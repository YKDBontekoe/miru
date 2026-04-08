import React, { useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '../../src/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { SkeletonAgentCard } from '@/components/SkeletonCard';
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
import { useColorScheme } from 'nativewind';
import { theme } from '@/core/theme';
import { HOME_COLORS } from '@/components/home/homeTheme';
import { formatDate, formatTimeRange, getFirstName, getGreeting, getInitials, isSameDay } from '@/components/home/homeUtils';
import { useAgentStore } from '../../src/store/useAgentStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useProductivityStore } from '../../src/store/useProductivityStore';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const { tasks, events, fetchTasks, fetchEvents, toggleTask } = useProductivityStore();

  const [refreshing, setRefreshing] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);

  const hour = new Date().getHours();
  const greeting = getGreeting(hour, t);
  const firstName = getFirstName(user?.email);
  const initials = getInitials(user?.email);

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

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: HOME_COLORS.bg }}>
        <View style={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 20 }}>
          <SkeletonAgentCard index={0} />
          <SkeletonAgentCard index={1} />
          <SkeletonAgentCard index={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: HOME_COLORS.bg }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={HOME_COLORS.primary}
            colors={[isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT]}
          />
        }
        contentContainerStyle={{
          paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 70,
        }}
      >
        <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
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
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
            <View style={{ marginBottom: 10 }}>
              <View
                style={{
                  height: 8,
                  borderRadius: 8,
                  backgroundColor: HOME_COLORS.softSurface,
                  overflow: 'hidden',
                  marginBottom: 10,
                }}
              >
                <View
                  style={{
                    width: `${completionRate}%`,
                    height: 8,
                    borderRadius: 8,
                    backgroundColor: HOME_COLORS.primary,
                  }}
                />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
                  {t('home.focus.completed', { count: completedCount, defaultValue: '{{count}} completed' })}
                </AppText>
                <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
                  {t('home.focus.remaining', {
                    count: sortedPendingTasks.length,
                    defaultValue: '{{count}} remaining',
                  })}
                </AppText>
              </View>
            </View>

            {sortedPendingTasks.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: HOME_COLORS.primarySoft,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="checkmark-circle" size={20} color={HOME_COLORS.primary} />
                <AppText
                  variant="bodySm"
                  style={{ marginLeft: 8, color: HOME_COLORS.text, fontWeight: '600' }}
                >
                  {t('home.tasks.caught_up')}
                </AppText>
              </View>
            ) : (
              sortedPendingTasks
                .slice(0, 4)
                .map((task) => <HomeTaskRow key={task.id} task={task} onToggle={() => toggleTask(task.id)} />)
            )}
          </HomeSurfaceCard>

          <HomeSurfaceCard>
            <HomeSectionHeader
              title={t('home.sections.today_timeline', { defaultValue: 'Today timeline' })}
              actionLabel={t('home.actions.see_all')}
              onAction={() => router.push('/(main)/productivity')}
            />
            {upcomingEvents.length === 0 ? (
              <View
                style={{
                  borderRadius: 16,
                  backgroundColor: HOME_COLORS.accentSoft,
                  padding: 12,
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="sunny" size={18} color={HOME_COLORS.accent} />
                <AppText variant="bodySm" style={{ marginLeft: 8, color: '#845127', fontWeight: '600' }}>
                  {t('home.events.none', { defaultValue: 'No upcoming events' })}
                </AppText>
              </View>
            ) : (
              upcomingEvents.map((event) => (
                <View
                  key={event.id}
                  style={{
                    borderRadius: 16,
                    backgroundColor: HOME_COLORS.softSurface,
                    padding: 12,
                    marginBottom: 8,
                  }}
                >
                  <AppText variant="bodySm" style={{ color: HOME_COLORS.text, fontWeight: '700' }} numberOfLines={1}>
                    {event.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: HOME_COLORS.muted, marginTop: 3 }}>
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
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
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
            <HomeSurfaceCard style={{ backgroundColor: '#F7FBF8' }}>
              <View style={{ alignItems: 'center', paddingVertical: 18 }}>
                <View
                  style={{
                    width: 76,
                    height: 76,
                    borderRadius: 26,
                    backgroundColor: HOME_COLORS.primarySoft,
                    justifyContent: 'center',
                    alignItems: 'center',
                    marginBottom: 14,
                  }}
                >
                  <Ionicons name="sparkles" size={30} color={HOME_COLORS.primary} />
                </View>
                <AppText variant="h2" style={{ color: HOME_COLORS.text, marginBottom: 8, textAlign: 'center' }}>
                  {t('home.empty.title')}
                </AppText>
                <AppText
                  variant="bodySm"
                  style={{ color: HOME_COLORS.muted, textAlign: 'center', marginBottom: 16, lineHeight: 20 }}
                >
                  {t('home.empty.desc')}
                </AppText>
                <ScalePressable
                  onPress={() => setShowNewChat(true)}
                  style={{
                    borderRadius: 16,
                    backgroundColor: HOME_COLORS.primary,
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    flexDirection: 'row',
                    alignItems: 'center',
                  }}
                >
                  <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
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
