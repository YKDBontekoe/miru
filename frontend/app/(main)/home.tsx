import React, { useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, ScrollView, View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'nativewind';
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
import { formatDate, formatTimeRange, getFirstName, getGreeting, getInitials, isSameDay } from '@/components/home/homeUtils';
import { useAgentStore } from '../../src/store/useAgentStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { theme } from '@/core/theme';

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

  const styles = useMemo(() => createStyles(isDark), [isDark]);

  if (isLoadingRooms && rooms.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <SkeletonAgentCard index={0} />
          <SkeletonAgentCard index={1} />
          <SkeletonAgentCard index={2} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
          />
        }
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.content}>
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
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View style={[styles.progressBarFill, { width: `${completionRate}%` }]} />
              </View>
              <View style={styles.progressTextContainer}>
                <AppText variant="caption" style={styles.progressText}>
                  {t('home.focus.completed', { count: completedCount, defaultValue: '{{count}} completed' })}
                </AppText>
                <AppText variant="caption" style={styles.progressText}>
                  {t('home.focus.remaining', {
                    count: sortedPendingTasks.length,
                    defaultValue: '{{count}} remaining',
                  })}
                </AppText>
              </View>
            </View>

            {sortedPendingTasks.length === 0 ? (
              <View style={styles.caughtUpContainer}>
                <Ionicons
                  name="checkmark-circle"
                  size={20}
                  color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
                />
                <AppText variant="bodySm" style={styles.caughtUpText}>
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
              <View style={styles.noEventsContainer}>
                <Ionicons name="sunny" size={18} color={theme.colors.status.warning} />
                <AppText variant="bodySm" style={styles.noEventsText}>
                  {t('home.events.none', { defaultValue: 'No upcoming events' })}
                </AppText>
              </View>
            ) : (
              upcomingEvents.map((event) => (
                <View key={event.id} style={styles.eventContainer}>
                  <AppText variant="bodySm" style={styles.eventTitle} numberOfLines={1}>
                    {event.title}
                  </AppText>
                  <AppText variant="caption" style={styles.eventTime}>
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
            <HomeSurfaceCard style={styles.emptyStateCard}>
              <View style={styles.emptyStateContainer}>
                <View style={styles.emptyStateIconContainer}>
                  <Ionicons
                    name="sparkles"
                    size={30}
                    color={isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT}
                  />
                </View>
                <AppText variant="h2" style={styles.emptyStateTitle}>
                  {t('home.empty.title')}
                </AppText>
                <AppText variant="bodySm" style={styles.emptyStateDesc}>
                  {t('home.empty.desc')}
                </AppText>
                <ScalePressable
                  onPress={() => setShowNewChat(true)}
                  style={styles.emptyStateButton}
                >
                  <Ionicons name="add" size={18} color={theme.colors.white} style={styles.emptyStateButtonIcon} />
                  <AppText variant="bodySm" style={styles.emptyStateButtonText}>
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

const createStyles = (isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: isDark ? theme.colors.background.dark : theme.colors.background.light,
  },
  loadingContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.md,
    paddingBottom: theme.spacing.xl,
  },
  scrollContent: {
    paddingBottom: theme.spacing.massive + (Platform.OS === 'ios' ? theme.spacing.xxxl : theme.spacing.lg) + 70,
  },
  content: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.lg,
  },
  gridContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  progressContainer: {
    marginBottom: theme.spacing.md,
  },
  progressBarBackground: {
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    overflow: 'hidden',
    marginBottom: theme.spacing.md,
  },
  progressBarFill: {
    height: 8,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressText: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
  },
  caughtUpContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  caughtUpText: {
    marginLeft: theme.spacing.sm,
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '600',
  },
  noEventsContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? theme.colors.status.warningSurfaceDark : theme.colors.status.warningSurfaceLight,
    padding: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  noEventsText: {
    marginLeft: theme.spacing.sm,
    color: theme.colors.status.warning,
    fontWeight: '600',
  },
  eventContainer: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  eventTitle: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    fontWeight: '700',
  },
  eventTime: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
    marginTop: 3,
  },
  emptyStateCard: {
    backgroundColor: isDark ? theme.colors.surface.highDark : theme.colors.surface.highLight,
  },
  emptyStateContainer: {
    alignItems: 'center',
    paddingVertical: theme.spacing.lg,
  },
  emptyStateIconContainer: {
    width: theme.spacing.massive + theme.spacing.avatar,
    height: theme.spacing.massive + theme.spacing.avatar,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: isDark ? `${theme.colors.primary.DEFAULT}33` : theme.colors.primary.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  emptyStateTitle: {
    color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light,
    marginBottom: theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateDesc: {
    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
    textAlign: 'center',
    marginBottom: theme.spacing.lg,
    lineHeight: 20,
  },
  emptyStateButton: {
    borderRadius: theme.borderRadius.lg,
    backgroundColor: isDark ? theme.colors.primary.light : theme.colors.primary.DEFAULT,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyStateButtonIcon: {
    marginRight: 6,
  },
  emptyStateButtonText: {
    color: theme.colors.white,
    fontWeight: '700',
  },
});
