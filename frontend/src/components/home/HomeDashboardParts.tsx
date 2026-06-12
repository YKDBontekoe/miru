import React from 'react';
import { StyleProp, View, ViewStyle, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent, ChatRoom, Task } from '@/core/models';
import { HOME_COLORS, HOME_SHADOW } from './homeTheme';
import { relativeTimeFromNow } from './homeUtils';
import { theme } from '@/core/theme';

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
    <View style={styles.sectionHeader}>
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
        styles.surfaceCard,
        HOME_SHADOW,
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
    <ScalePressable onPress={onPress} style={styles.actionTile}>
      <View style={styles.actionIconContainer}>
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
    <ScalePressable onPress={onToggle} style={styles.taskRow}>
      <View
        style={[
          styles.taskCheckbox,
          {
            borderColor: task.completed ? HOME_COLORS.primary : HOME_COLORS.taskCheckBorder,
            backgroundColor: task.completed ? HOME_COLORS.primary : 'transparent',
          },
        ]}
      >
        {task.completed ? <Ionicons name="checkmark" size={14} color={HOME_COLORS.taskCheckIcon} /> : null}
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
        <View style={styles.taskDueBadge}>
          <AppText variant="caption" style={{ color: HOME_COLORS.taskDueText, fontWeight: '700' }}>
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
    <ScalePressable onPress={onPress} style={styles.chatRow}>
      <View style={styles.chatIconContainer}>
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
    <ScalePressable onPress={onPress} style={styles.agentBadge}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 6 }}>
        <View style={styles.agentIconContainer}>
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
    <View style={[styles.heroCard, HOME_SHADOW]}>
      <View
        style={{
          position: 'absolute',
          width: 180,
          height: 180,
          borderRadius: theme.borderRadius.full,
          backgroundColor: HOME_COLORS.heroGreenCircle,
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
          borderRadius: theme.borderRadius.full,
          backgroundColor: HOME_COLORS.heroOrangeCircle,
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
          <AppText variant="bodySm" style={{ color: HOME_COLORS.heroTextSoft, fontWeight: '600' }}>
            {greeting}
          </AppText>
          <AppText variant="h1" numberOfLines={1} style={{ color: HOME_COLORS.heroTextStrong, fontWeight: '700' }}>
            {firstName}
          </AppText>
          <AppText variant="caption" style={{ color: HOME_COLORS.heroTextSoft }}>
            {dateText}
          </AppText>
        </View>
        <ScalePressable onPress={onSettingsPress} style={styles.heroSettingsBtn}>
          <AppText variant="bodySm" style={{ color: HOME_COLORS.heroTextStrong, fontWeight: '700' }}>
            {initials}
          </AppText>
        </ScalePressable>
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <View style={styles.heroStatCard}>
          <AppText variant="caption" style={{ color: HOME_COLORS.heroTextSoft, marginBottom: 2 }}>
            {t('home.hero.today_focus', { defaultValue: 'Today focus' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: HOME_COLORS.heroTextStrong, fontWeight: '700' }}>
            {todayTaskCount > 0
              ? t('home.hero.tasks_due_today', {
                  count: todayTaskCount,
                  defaultValue: '{{count}} tasks due today',
                })
              : t('home.hero.no_deadlines', { defaultValue: 'No deadlines today' })}
          </AppText>
        </View>
        <View style={styles.heroStatCard}>
          <AppText variant="caption" style={{ color: HOME_COLORS.heroTextSoft, marginBottom: 2 }}>
            {t('home.hero.completion', { defaultValue: 'Completion' })}
          </AppText>
          <AppText variant="bodySm" style={{ color: HOME_COLORS.heroTextStrong, fontWeight: '700' }}>
            {completionRate}% {t('home.hero.complete', { defaultValue: 'complete' })}
          </AppText>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.md,
  },
  surfaceCard: {
    backgroundColor: HOME_COLORS.surface,
    borderRadius: theme.borderRadius.xxl,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  actionTile: {
    width: '48.5%',
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.md,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: theme.spacing.sm,
  },
  actionIconContainer: {
    width: theme.spacing.xxxl + theme.spacing.xxs,
    height: theme.spacing.xxxl + theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: theme.spacing.sm,
  },
  taskRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    backgroundColor: HOME_COLORS.softSurface,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  taskCheckbox: {
    width: theme.spacing.xxl,
    height: theme.spacing.xxl,
    borderRadius: theme.borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.md,
  },
  taskDueBadge: {
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.accentSoft,
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.md,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: HOME_COLORS.softSurface,
    marginBottom: theme.spacing.sm,
  },
  chatIconContainer: {
    width: theme.spacing.xxxl + theme.spacing.xxs,
    height: theme.spacing.xxxl + theme.spacing.xxs,
    borderRadius: theme.borderRadius.md,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  agentBadge: {
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: HOME_COLORS.border,
    backgroundColor: HOME_COLORS.surface,
    padding: theme.spacing.md,
    width: '48.5%',
    marginBottom: theme.spacing.sm,
  },
  agentIconContainer: {
    width: theme.spacing.xxxl - theme.spacing.xxs,
    height: theme.spacing.xxxl - theme.spacing.xxs,
    borderRadius: theme.borderRadius.sm,
    backgroundColor: HOME_COLORS.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: theme.spacing.sm,
  },
  heroCard: {
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: HOME_COLORS.deep,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    overflow: 'hidden',
  },
  heroSettingsBtn: {
    width: theme.spacing.inputBarButton,
    height: theme.spacing.inputBarButton,
    borderRadius: theme.borderRadius.xxl,
    backgroundColor: HOME_COLORS.heroSettingsBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroStatCard: {
    flex: 1,
    borderRadius: theme.borderRadius.lg,
    backgroundColor: HOME_COLORS.heroStatBg,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
  },
});
