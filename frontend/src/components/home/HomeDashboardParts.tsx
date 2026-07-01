import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { theme } from '@/core/theme';
import { relativeTimeFromNow } from './homeUtils';

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View className="flex-row justify-between items-center mb-md">
      <AppText variant="h3" className="text-onSurface-light dark:text-onSurface-dark font-bold">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" className="text-primary-DEFAULT font-bold">
            {actionLabel}
          </AppText>
        </ScalePressable>
      ) : null}
    </View>
  );
}

export function HomeSurfaceCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View
      className="bg-surface-light dark:bg-surface-dark rounded-xxl border border-border-light dark:border-border-dark p-lg mb-md shadow-md"
      style={style}
    >
      {children}
    </View>
  );
}

export function HomeActionTile({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  onPress: () => void;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      className="w-[48%] border border-border-light dark:border-border-dark rounded-xl py-md px-md bg-surface-highLight dark:bg-surface-highDark mb-sm"
    >
      <View className="w-[34px] h-[34px] rounded-md bg-primary-surfaceLight dark:bg-primary-surface flex items-center justify-center mb-sm">
        <Ionicons name={icon} size={18} color={theme.colors.primary.DEFAULT} className="text-primary-DEFAULT" />
      </View>
      <AppText variant="bodySm" className="text-onSurface-light dark:text-onSurface-dark font-bold">
        {label}
      </AppText>
    </ScalePressable>
  );
}

export function HomeTaskRow({ task, onToggle }: { task: Task; onToggle: () => void }) {
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      className="flex-row items-center rounded-lg bg-surface-highLight dark:bg-surface-highDark px-md py-md mb-sm"
    >
      <View
        className={`w-[24px] h-[24px] rounded-md border-2 items-center justify-center mr-md ${task.completed ? 'border-primary-DEFAULT bg-primary-DEFAULT' : 'border-border-light dark:border-border-dark bg-transparent'}`}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color={theme.colors.white} /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        className={`flex-1 font-semibold ${task.completed ? 'text-onSurface-mutedLight dark:text-onSurface-mutedDark line-through' : 'text-onSurface-light dark:text-onSurface-dark'}`}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View className="rounded-md bg-status-warningSurfaceLight dark:bg-status-warningSurfaceDark px-sm py-xs">
          <AppText variant="caption" className="text-status-warning font-bold">
            {dueText}
          </AppText>
        </View>
      ) : null}
    </ScalePressable>
  );
}

export function HomeChatRow({
  room,
  onPress,
  t,
}: {
  room: ChatRoom;
  onPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <ScalePressable
      onPress={onPress}
      className="flex-row items-center px-md py-md rounded-lg bg-surface-highLight dark:bg-surface-highDark mb-sm"
    >
      <View className="w-[34px] h-[34px] rounded-md bg-primary-surfaceLight dark:bg-primary-surface items-center justify-center mr-md">
        <AppText variant="bodySm" className="text-primary-DEFAULT font-extrabold">
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View className="flex-1 pr-sm">
        <AppText
          variant="bodySm"
          numberOfLines={1}
          className="text-onSurface-light dark:text-onSurface-dark font-bold"
        >
          {room.name}
        </AppText>
        <AppText
          variant="caption"
          numberOfLines={1}
          className="text-onSurface-mutedLight dark:text-onSurface-mutedDark"
        >
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View className="items-end">
        <AppText
          variant="caption"
          className="text-onSurface-mutedLight dark:text-onSurface-mutedDark mb-[2px]"
        >
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={theme.colors.onSurface.mutedLight} />
      </View>
    </ScalePressable>
  );
}

export function HomeAgentBadge({ agent, onPress }: { agent: Agent; onPress: () => void }) {
  return (
    <ScalePressable
      onPress={onPress}
      className="rounded-xl border border-border-light dark:border-border-dark bg-surface-light dark:bg-surface-dark p-sm w-[48%] mb-sm"
    >
      <View className="flex-row items-center mb-sm">
        <View className="w-[30px] h-[30px] rounded-md bg-primary-surfaceLight dark:bg-primary-surface flex items-center justify-center mr-sm">
          <AppText variant="bodySm" className="text-primary-DEFAULT font-extrabold">
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText
            variant="bodySm"
            numberOfLines={1}
            className="text-onSurface-light dark:text-onSurface-dark font-bold"
          >
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText
        variant="caption"
        className="text-onSurface-mutedLight dark:text-onSurface-mutedDark"
      >
        {agent.message_count} {agent.message_count === 1 ? 'message' : 'messages'}
      </AppText>
    </ScalePressable>
  );
}

export function HomeHeroCard({
  greeting,
  firstName,
  dateText,
  initials,
  todayTaskCount,
  completionRate,
  onSettingsPress,
  t,
}: {
  greeting: string;
  firstName: string;
  dateText: string;
  initials: string;
  todayTaskCount: number;
  completionRate: number;
  onSettingsPress: () => void;
  t: (key: string, opts?: Record<string, unknown>) => string;
}) {
  return (
    <View className="rounded-xxl bg-primary-dark p-lg mb-md overflow-hidden shadow-lg">
      <View style={{ position: 'absolute', width: 180, height: 180, borderRadius: 90, backgroundColor: theme.colors.status.success, opacity: 0.25, top: -90, right: -40 }} />
      <View style={{ position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: theme.colors.status.warning, opacity: 0.25, bottom: -44, left: -24 }} />

      <View className="flex-row justify-between items-start mb-lg">
        <View className="flex-1 pr-sm">
          <AppText variant="bodySm" className="text-primary-surfaceLight font-semibold">
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} className="text-white font-bold">
            {firstName}
          </AppText>
          <AppText variant="caption" className="text-primary-surfaceLight">
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          className="w-[44px] h-[44px] rounded-[22px] bg-primary-DEFAULT flex items-center justify-center"
        >
          <AppText variant="bodySm" className="text-white font-bold">
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View className="flex-row gap-sm">
        <View className="flex-1 rounded-md bg-primary-DEFAULT py-sm px-sm">
          <AppText variant="caption" className="text-primary-surfaceLight mb-[2px]">
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" className="text-white font-bold">
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View className="flex-1 rounded-md bg-primary-DEFAULT py-sm px-sm">
          <AppText variant="caption" className="text-primary-surfaceLight mb-[2px]">
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" className="text-white font-bold">
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}
