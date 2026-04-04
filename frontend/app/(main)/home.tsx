import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Platform, RefreshControl, SectionList, View } from 'react-native';
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
import { HOME_COLORS } from '@/components/home/homeTheme';
import { formatDate, formatTimeRange, getFirstName, getGreeting, getInitials, isSameDay } from '@/components/home/homeUtils';
import { useAgentStore } from '../../src/store/useAgentStore';
import { useAuthStore } from '../../src/store/useAuthStore';
import { useChatStore } from '../../src/store/useChatStore';
import { useProductivityStore } from '../../src/store/useProductivityStore';
import { Task, CalendarEvent, ChatRoom, Agent } from '@/core/models';

type SectionItem =
  | { type: 'hero'; greeting: string; firstName: string; initials: string; todayTaskCount: number; completionRate: number }
  | { type: 'quick_actions' }
  | { type: 'focus_board_header'; completionRate: number; completedCount: number; remainingCount: number }
  | { type: 'focus_board_caught_up' }
  | { type: 'task'; task: Task }
  | { type: 'timeline_header' }
  | { type: 'timeline_empty' }
  | { type: 'event'; event: CalendarEvent }
  | { type: 'recent_chats_header' }
  | { type: 'chat'; room: ChatRoom }
  | { type: 'agents_header' }
  | { type: 'agents_row'; agents: Agent[] }
  | { type: 'empty_state' };

const renderItemStatic = ({
  item,
  router,
  t,
  i18n,
  setShowNewChat,
  toggleTask,
}: {
  item: SectionItem;
  router: any;
  t: any;
  i18n: any;
  setShowNewChat: (v: boolean) => void;
  toggleTask: (id: string) => void;
}) => {
  if (item.type === 'hero') {
    return (
      <View style={{ marginBottom: 16 }}>
        <HomeHeroCard
          greeting={item.greeting}
          firstName={item.firstName}
          dateText={formatDate(new Date(), i18n.language)}
          initials={item.initials}
          todayTaskCount={item.todayTaskCount}
          completionRate={item.completionRate}
          onSettingsPress={() => router.push('/(main)/settings')}
          t={t}
        />
      </View>
    );
  }
  if (item.type === 'quick_actions') {
    return (
      <View style={{ marginBottom: 16 }}>
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
      </View>
    );
  }
  if (item.type === 'focus_board_header') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 }}>
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
                width: `${item.completionRate}%`,
                height: 8,
                borderRadius: 8,
                backgroundColor: HOME_COLORS.primary,
              }}
            />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
              {t('home.focus.completed', { count: item.completedCount, defaultValue: '{{count}} completed' })}
            </AppText>
            <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
              {t('home.focus.remaining', {
                count: item.remainingCount,
                defaultValue: '{{count}} remaining',
              })}
            </AppText>
          </View>
        </View>
      </View>
    );
  }
  if (item.type === 'focus_board_caught_up') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 16, paddingBottom: 16, marginBottom: 16 }}>
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
      </View>
    );
  }
  if (item.type === 'task') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, paddingHorizontal: 16 }}>
        <HomeTaskRow task={item.task} onToggle={() => toggleTask(item.task.id)} />
      </View>
    );
  }
  if (item.type === 'timeline_header') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 }}>
        <HomeSectionHeader
          title={t('home.sections.today_timeline', { defaultValue: 'Today timeline' })}
          actionLabel={t('home.actions.see_all')}
          onAction={() => router.push('/(main)/productivity')}
        />
      </View>
    );
  }
  if (item.type === 'timeline_empty') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 16, paddingBottom: 16, marginBottom: 16 }}>
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
      </View>
    );
  }
  if (item.type === 'event') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, paddingHorizontal: 16 }}>
        <View
          style={{
            borderRadius: 16,
            backgroundColor: HOME_COLORS.softSurface,
            padding: 12,
            marginBottom: 8,
          }}
        >
          <AppText variant="bodySm" style={{ color: HOME_COLORS.text, fontWeight: '700' }} numberOfLines={1}>
            {item.event.title}
          </AppText>
          <AppText variant="caption" style={{ color: HOME_COLORS.muted, marginTop: 3 }}>
            {formatTimeRange(item.event, i18n.language)}
            {item.event.location ? ` · ${item.event.location}` : ''}
          </AppText>
        </View>
      </View>
    );
  }
  if (item.type === 'recent_chats_header') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 }}>
        <HomeSectionHeader
          title={t('home.sections.recent_chats')}
          actionLabel={t('home.actions.see_all')}
          onAction={() => router.push('/(main)/chat')}
        />
      </View>
    );
  }
  if (item.type === 'chat') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, paddingHorizontal: 16 }}>
        <HomeChatRow
          room={item.room}
          onPress={() => router.push(`/(main)/chat/${item.room.id}`)}
          t={t}
        />
      </View>
    );
  }
  if (item.type === 'agents_header') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 16, paddingTop: 16 }}>
        <HomeSectionHeader
          title={t('home.sections.your_agents')}
          actionLabel={t('home.actions.manage')}
          onAction={() => router.push('/(main)/agents')}
        />
      </View>
    );
  }
  if (item.type === 'agents_row') {
    return (
      <View style={{ backgroundColor: HOME_COLORS.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, paddingHorizontal: 16, paddingBottom: 16, marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap' }}>
          {item.agents.map((agent) => (
            <HomeAgentBadge
              key={agent.id}
              agent={agent}
              onPress={() => router.push('/(main)/agents')}
            />
          ))}
        </View>
      </View>
    );
  }
  if (item.type === 'empty_state') {
    return (
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
    );
  }
  return null;
};

// Extracted renderItem wrapped in React.memo for SectionList to use
const RenderItem = React.memo(function RenderItem({
  item,
  router,
  t,
  i18n,
  setShowNewChat,
  toggleTask,
}: {
  item: SectionItem;
  router: any;
  t: any;
  i18n: any;
  setShowNewChat: (v: boolean) => void;
  toggleTask: (id: string) => void;
}) {
  return renderItemStatic({ item, router, t, i18n, setShowNewChat, toggleTask });
});

export default function HomeScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const { user } = useAuthStore();
  const { rooms, fetchRooms, isLoadingRooms } = useChatStore();
  const { agents, fetchAgents, isLoading: isLoadingAgents } = useAgentStore();
  const { tasks, events, fetchTasks, fetchEvents, toggleTask, isLoading: isLoadingProductivity } = useProductivityStore();

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

  const sections = useMemo(() => {
    const s = [];

    // 1. Hero
    s.push({
      type: 'hero',
      data: [{ type: 'hero', greeting, firstName, initials, todayTaskCount, completionRate } as SectionItem]
    });

    // 2. Quick Actions
    s.push({
      type: 'quick_actions',
      data: [{ type: 'quick_actions' } as SectionItem]
    });

    // 3. Focus Board
    const focusBoardData: SectionItem[] = [
      { type: 'focus_board_header', completionRate, completedCount, remainingCount: sortedPendingTasks.length }
    ];
    if (sortedPendingTasks.length === 0) {
      focusBoardData.push({ type: 'focus_board_caught_up' });
    } else {
      sortedPendingTasks.slice(0, 4).forEach((task) => {
        focusBoardData.push({ type: 'task', task });
      });
    }
    s.push({ type: 'focus_board', data: focusBoardData });

    // 4. Timeline
    const timelineData: SectionItem[] = [{ type: 'timeline_header' }];
    if (upcomingEvents.length === 0) {
      timelineData.push({ type: 'timeline_empty' });
    } else {
      upcomingEvents.forEach(event => {
        timelineData.push({ type: 'event', event });
      });
    }
    s.push({ type: 'timeline', data: timelineData });

    // 5. Recent Chats
    if (recentRooms.length > 0) {
      const chatsData: SectionItem[] = [{ type: 'recent_chats_header' }];
      recentRooms.forEach(room => {
        chatsData.push({ type: 'chat', room });
      });
      s.push({ type: 'recent_chats', data: chatsData });
    }

    // 6. Agents
    if (agents.length > 0) {
      s.push({
        type: 'agents',
        data: [
          { type: 'agents_header' } as SectionItem,
          { type: 'agents_row', agents: agents.slice(0, 4) } as SectionItem
        ]
      });
    }

    // 7. Empty State
    if (
      rooms.length === 0 &&
      agents.length === 0 &&
      tasks.length === 0 &&
      events.length === 0 &&
      !isLoadingRooms &&
      !isLoadingAgents &&
      !isLoadingProductivity
    ) {
      s.push({
        type: 'empty_state',
        data: [{ type: 'empty_state' } as SectionItem]
      });
    }

    return s;
  }, [
    agents,
    completionRate,
    completedCount,
    firstName,
    greeting,
    initials,
    isLoadingRooms,
    isLoadingAgents,
    isLoadingProductivity,
    recentRooms,
    rooms.length,
    sortedPendingTasks,
    tasks.length,
    events.length,
    todayTaskCount,
    upcomingEvents,
  ]);

  const renderSectionFooter = useCallback(({ section }: any) => {
    // Add bottom rounding to sections that have multiple items
    if (['focus_board', 'timeline', 'recent_chats'].includes(section.type)) {
      const hasEmptyState = section.data.some(
        (item: SectionItem) => item.type === 'focus_board_caught_up' || item.type === 'timeline_empty'
      );
      if (!hasEmptyState) {
        return <View style={{ backgroundColor: HOME_COLORS.surface, borderBottomLeftRadius: 24, borderBottomRightRadius: 24, height: 16, marginBottom: 16 }} />;
      }
    }
    return null;
  }, []);

  const keyExtractor = useCallback((item: SectionItem, index: number) => {
    if (item.type === 'task') return `task-${item.task.id}`;
    if (item.type === 'event') return `event-${item.event.id}`;
    if (item.type === 'chat') return `chat-${item.room.id}`;
    return `${item.type}-${index}`;
  }, []);

  const boundRenderItem = useCallback(
    ({ item }: { item: SectionItem }) => (
      <RenderItem
        item={item}
        router={router}
        t={t}
        i18n={i18n}
        setShowNewChat={setShowNewChat}
        toggleTask={toggleTask}
      />
    ),
    [router, t, i18n, setShowNewChat, toggleTask]
  );

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
      <SectionList
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={HOME_COLORS.primary} />
        }
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 48 + (Platform.OS === 'ios' ? 32 : 16) + 70,
        }}
        sections={sections}
        keyExtractor={keyExtractor}
        renderItem={boundRenderItem}
        renderSectionFooter={renderSectionFooter}
        stickySectionHeadersEnabled={false}
      />

      <HomeNewChatModal
        visible={showNewChat}
        onClose={() => setShowNewChat(false)}
        onCreated={fetchRooms}
      />
    </SafeAreaView>
  );
}
