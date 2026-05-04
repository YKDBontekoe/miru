import React, { useEffect, useMemo, useState } from 'react';
import { LayoutAnimation, Platform, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
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
import { theme } from '@/core/theme';

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const { C } = useTheme();

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

  const handleToggleTask = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    toggleTask(id);
  };

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
        <View style={styles.contentContainer}>
          <View style={[styles.skeletonHero, { backgroundColor: C.surfaceHigh }]} />
          <View style={styles.skeletonGrid}>
            <View style={[styles.skeletonTile, { backgroundColor: C.surfaceHigh }]} />
            <View style={[styles.skeletonTile, { backgroundColor: C.surfaceHigh }]} />
            <View style={[styles.skeletonTile, { backgroundColor: C.surfaceHigh }]} />
            <View style={[styles.skeletonTile, { backgroundColor: C.surfaceHigh }]} />
          </View>
          <View style={[styles.skeletonCard, { backgroundColor: C.surfaceHigh }]} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: C.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={C.primary} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.contentContainer}>
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
            <View style={styles.gridContainer}>
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
            <View style={{ marginBottom: theme.spacing.sm }}>
              <View style={[styles.progressBarBg, { backgroundColor: C.surfaceHigh }]}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${completionRate}%`,
                      backgroundColor: C.primary,
                    },
                  ]}
                />
              </View>
              <View style={styles.progressLabels}>
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
              <View style={[styles.caughtUpCard, { backgroundColor: C.primarySurface }]}>
                <Ionicons name="checkmark-circle" size={20} color={C.primary} />
                <AppText variant="bodySm" style={[styles.caughtUpText, { color: C.text }]}>
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
              <View style={[styles.emptyEventCard, { backgroundColor: C.dangerSurface }]}>
                <Ionicons name="sunny" size={18} color={C.danger} />
                <AppText variant="bodySm" style={[styles.emptyEventText, { color: C.danger }]}>
                  {t('home.events.none', { defaultValue: 'No upcoming events' })}
                </AppText>
              </View>
            ) : (
              upcomingEvents.map((event) => (
                <View key={event.id} style={[styles.eventCard, { backgroundColor: C.surfaceHigh }]}>
                  <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }} numberOfLines={1}>
                    {event.title}
                  </AppText>
                  <AppText variant="caption" style={{ color: C.muted, marginTop: theme.spacing.xxs }}>
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
              <View style={styles.gridContainer}>
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
              <View style={styles.emptyStateContainer}>
                <View style={[styles.emptyStateIconContainer, { backgroundColor: C.primarySurface }]}>
                  <Ionicons name="sparkles" size={30} color={C.primary} />
                </View>
                <AppText variant="h2" style={[styles.emptyStateTitle, { color: C.text }]}>
                  {t('home.empty.title')}
                </AppText>
                <AppText variant="bodySm" style={[styles.emptyStateDesc, { color: C.muted }]}>
                  {t('home.empty.desc')}
                </AppText>
                <ScalePressable
                  onPress={() => setShowNewChat(true)}
                  style={[styles.emptyStateButton, { backgroundColor: C.primary }]}
                >
                  <Ionicons name="add" size={18} color={theme.colors.white} style={{ marginRight: theme.spacing.xs }} />
                  <AppText variant="bodySm" style={{ color: theme.colors.white, fontWeight: '700' }}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 70,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  progressBarBg: {
    height: 8,
    borderRadius: theme.borderRadius.sm,
    overflow: 'hidden',
    marginBottom: theme.spacing.sm,
  },
  progressBarFill: {
    height: 8,
    borderRadius: theme.borderRadius.sm,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caughtUpCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  caughtUpText: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  emptyEventCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyEventText: {
    marginLeft: theme.spacing.sm,
    fontWeight: '600',
  },
  eventCard: {
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyStateIconContainer: {
    width: 76,
    height: 76,
    borderRadius: theme.borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateDesc: {
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  emptyStateButton: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonHero: {
    height: 180,
    borderRadius: theme.borderRadius.xxl,
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
  skeletonGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: theme.spacing.md,
  },
  skeletonTile: {
    width: '48.5%',
    height: 80,
    borderRadius: theme.borderRadius.lg,
    marginBottom: theme.spacing.sm,
  },
  skeletonCard: {
    height: 220,
    borderRadius: theme.borderRadius.xxl,
    marginBottom: theme.spacing.md,
    ...theme.elevation.md,
  },
});
