import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { relativeTimeFromNow } from './homeUtils';
import { useTheme } from '@/hooks/useTheme';

export function HomeSectionHeader({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const { C } = useTheme();
  return (
    <View className="mb-3 flex-row items-center justify-between">
      <AppText variant="h3" style={{ color: C.text }} className="font-bold">
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction} className="p-1">
          <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '700' }}>
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
  const { C } = useTheme();
  return (
    <View
      style={[{ backgroundColor: C.surface, borderColor: C.border }, style]}
      className="mb-4 rounded-3xl border p-4 shadow-md dark:shadow-none"
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
  const { C } = useTheme();
  return (
    <ScalePressable
      onPress={onPress}
      style={{ borderColor: C.border, backgroundColor: C.surfaceHigh }}
      className="mb-2.5 w-[48.5%] rounded-2xl border px-3 py-3.5"
    >
      <View
        style={{ backgroundColor: C.primarySurface }}
        className="mb-2 h-8 w-8 items-center justify-center rounded-xl"
      >
        <Ionicons name={icon} size={18} color={C.primary} />
      </View>
      <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }}>
        {label}
      </AppText>
    </ScalePressable>
  );
}

export function HomeTaskRow({
  task,
  onToggle,
}: {
  task: Task;
  onToggle: () => void;
}) {
  const { C } = useTheme();
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      style={{ backgroundColor: C.surfaceHigh }}
      className="mb-2 flex-row items-center rounded-2xl px-3 py-2.5"
    >
      <View
        style={{
          borderColor: task.completed ? C.primary : C.muted,
          backgroundColor: task.completed ? C.primary : 'transparent',
        }}
        className="mr-2 h-6 w-6 items-center justify-center rounded-full border-2"
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={{
          color: task.completed ? C.muted : C.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
        }}
        className="flex-1 font-semibold"
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View style={{ backgroundColor: C.dangerSurface }} className="rounded-xl px-2 py-1">
          <AppText variant="caption" style={{ color: C.danger, fontWeight: '700' }}>
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
  const { C } = useTheme();
  return (
    <ScalePressable
      onPress={onPress}
      style={{ backgroundColor: C.surfaceHigh }}
      className="mb-2 flex-row items-center rounded-2xl px-3 py-3"
    >
      <View
        style={{ backgroundColor: C.primarySurface }}
        className="mr-2 h-8 w-8 items-center justify-center rounded-xl"
      >
        <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View className="flex-1 pr-2">
        <AppText variant="bodySm" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: C.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View className="items-end">
        <AppText variant="caption" style={{ color: C.muted }} className="mb-0.5">
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={C.muted} />
      </View>
    </ScalePressable>
  );
}

export function HomeAgentBadge({
  agent,
  onPress,
}: {
  agent: Agent;
  onPress: () => void;
}) {
  const { C } = useTheme();
  return (
    <ScalePressable
      onPress={onPress}
      style={{ borderColor: C.border, backgroundColor: C.surface }}
      className="mb-2 w-[48.5%] rounded-2xl border p-2.5"
    >
      <View className="mb-1 flex-row items-center">
        <View
          style={{ backgroundColor: C.primarySurface }}
          className="mr-2 h-7 w-7 items-center justify-center rounded-xl"
        >
          <AppText variant="bodySm" style={{ color: C.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="bodySm" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: C.muted }}>
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
  const { C } = useTheme();
  return (
    <View
      style={{ backgroundColor: C.primarySurface }}
      className="mb-4 overflow-hidden rounded-3xl px-4 py-4 shadow-md dark:shadow-none"
    >
      <View
        style={{ backgroundColor: C.primary }}
        className="absolute -right-10 -top-[90px] h-[180px] w-[180px] rounded-full opacity-15"
      />
      <View
        style={{ backgroundColor: C.success }}
        className="absolute -bottom-11 -left-6 h-[120px] w-[120px] rounded-full opacity-10"
      />

      <View className="mb-4 flex-row items-start justify-between">
        <View className="flex-1 pr-2">
          <AppText variant="bodySm" style={{ color: C.muted, fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: C.text, fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: C.muted }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={{ backgroundColor: C.primary }}
          className="h-11 w-11 items-center justify-center rounded-full"
        >
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View className="flex-row gap-2">
        <View style={{ backgroundColor: C.surfaceHigh }} className="flex-1 rounded-2xl px-2.5 py-2.5">
          <AppText variant="caption" style={{ color: C.muted }} className="mb-0.5">
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View style={{ backgroundColor: C.surfaceHigh }} className="flex-1 rounded-2xl px-2.5 py-2.5">
          <AppText variant="caption" style={{ color: C.muted }} className="mb-0.5">
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: C.text, fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}
