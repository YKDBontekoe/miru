import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';
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
    <View
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
      }}
    >
      <AppText variant="h3" style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
        {title}
      </AppText>
      {actionLabel && onAction ? (
        <ScalePressable onPress={onAction}>
          <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '700' }}>
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
      style={[
        {
          backgroundColor: HOME_COLORS.surface,
          borderRadius: 24,
          borderWidth: 1,
          borderColor: HOME_COLORS.border,
          padding: 16,
          marginBottom: 14,
          ...HOME_SHADOW,
        },
        style,
      ]}
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
      style={{
        width: '48.5%',
        borderWidth: 1,
        borderColor: HOME_COLORS.border,
        borderRadius: 18,
        paddingVertical: 14,
        paddingHorizontal: 12,
        backgroundColor: HOME_COLORS.softSurface,
        marginBottom: 10,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 12,
          backgroundColor: HOME_COLORS.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 8,
        }}
      >
        <Ionicons name={icon} size={18} color={HOME_COLORS.primary} />
      </View>
      <AppText variant="bodySm" style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
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
  const dueDate = task.due_date ? new Date(task.due_date) : null;
  const dueText =
    dueDate && !isNaN(dueDate.getTime())
      ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(dueDate)
      : null;

  return (
    <ScalePressable
      onPress={onToggle}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        backgroundColor: HOME_COLORS.softSurface,
        paddingHorizontal: 12,
        paddingVertical: 11,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 24,
          height: 24,
          borderRadius: 12,
          borderWidth: 2,
          borderColor: task.completed ? HOME_COLORS.primary : '#8FB7A7',
          backgroundColor: task.completed ? HOME_COLORS.primary : 'transparent',
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color="#FFFFFF" /> : null}
      </View>
      <AppText
        variant="bodySm"
        numberOfLines={1}
        style={{
          flex: 1,
          color: task.completed ? HOME_COLORS.muted : HOME_COLORS.text,
          textDecorationLine: task.completed ? 'line-through' : 'none',
          fontWeight: '600',
        }}
      >
        {task.title}
      </AppText>
      {dueText ? (
        <View
          style={{
            borderRadius: 12,
            backgroundColor: HOME_COLORS.accentSoft,
            paddingHorizontal: 8,
            paddingVertical: 4,
          }}
        >
          <AppText variant="caption" style={{ color: '#9E5817', fontWeight: '700' }}>
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
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 12,
        borderRadius: 16,
        backgroundColor: HOME_COLORS.softSurface,
        marginBottom: 8,
      }}
    >
      <View
        style={{
          width: 34,
          height: 34,
          borderRadius: 11,
          backgroundColor: HOME_COLORS.primarySoft,
          alignItems: 'center',
          justifyContent: 'center',
          marginRight: 10,
        }}
      >
        <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
          {room.name[0]?.toUpperCase() ?? '?'}
        </AppText>
      </View>
      <View style={{ flex: 1, paddingRight: 8 }}>
        <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
          {room.name}
        </AppText>
        <AppText variant="caption" numberOfLines={1} style={{ color: HOME_COLORS.muted }}>
          {t('home.actions.tap_to_continue')}
        </AppText>
      </View>
      <View style={{ alignItems: 'flex-end' }}>
        <AppText variant="caption" style={{ color: HOME_COLORS.muted, marginBottom: 2 }}>
          {relativeTimeFromNow(room.updated_at, t)}
        </AppText>
        <Ionicons name="chevron-forward" size={14} color={HOME_COLORS.muted} />
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
  return (
    <ScalePressable
      onPress={onPress}
      style={{
        borderRadius: 18,
        borderWidth: 1,
        borderColor: HOME_COLORS.border,
        backgroundColor: HOME_COLORS.surface,
        padding: 10,
        width: '48.5%',
        marginBottom: 10,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View
          style={{
            width: 30,
            height: 30,
            borderRadius: 10,
            backgroundColor: HOME_COLORS.primarySoft,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 8,
          }}
        >
          <AppText variant="bodySm" style={{ color: HOME_COLORS.primary, fontWeight: '800' }}>
            {agent.name?.[0]?.toUpperCase() ?? '?'}
          </AppText>
        </View>
        <View style={{ flex: 1 }}>
          <AppText variant="bodySm" numberOfLines={1} style={{ color: HOME_COLORS.text, fontWeight: '700' }}>
            {agent.name}
          </AppText>
        </View>
      </View>
      <AppText variant="caption" style={{ color: HOME_COLORS.muted }}>
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
    <View
      style={{
        borderRadius: 28,
        backgroundColor: HOME_COLORS.deep,
        paddingHorizontal: 18,
        paddingVertical: 18,
        marginBottom: 14,
        overflow: 'hidden',
        ...HOME_SHADOW,
      }}
    >
      <View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: 999,
          backgroundColor: '#2BA98A',
          opacity: 0.26,
          top: -90,
          right: -40,
        }}
      />
      <View
        style={{
          position: 'absolute',
          width: 120,
          height: 120,
          borderRadius: 999,
          backgroundColor: '#F0B470',
          opacity: 0.22,
          bottom: -44,
          left: -24,
        }}
      />

      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 16,
        }}
      >
        <View style={{ flex: 1, paddingRight: 8 }}>
          <AppText variant="bodySm" style={{ color: '#CDE9DF', fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: '#CDE9DF' }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable
          onPress={onSettingsPress}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            backgroundColor: '#2D6A58',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: '#215445',
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
        >
          <AppText variant="caption" style={{ color: '#CDE9DF', marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View
          style={{
            flex: 1,
            borderRadius: 14,
            backgroundColor: '#215445',
            paddingVertical: 10,
            paddingHorizontal: 10,
          }}
        >
          <AppText variant="caption" style={{ color: '#CDE9DF', marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: '#FFFFFF', fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}
