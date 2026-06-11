import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

interface ChatRoomHeaderProps {
  room: { name: string } | undefined;
  roomAgents: Agent[];
  onBack: () => void;
  onQuickViewAgent: (agent: Agent) => void;
  onManageAgentsPress: () => void;
  getAgentColor: (name: string) => string;
}

export const ChatRoomHeader = ({
  room,
  roomAgents,
  onBack,
  onQuickViewAgent,
  onManageAgentsPress,
  getAgentColor,
}: ChatRoomHeaderProps) => {
  const { t } = useTranslation();
  const { C } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: C.border, backgroundColor: C.surface }]}>
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.back', { defaultValue: 'Back' })}
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View style={[styles.roomIcon, { borderColor: C.primary, backgroundColor: C.surface }]}>
        <View style={[StyleSheet.absoluteFill, { backgroundColor: C.primary, opacity: 0.1 }]} />
        <AppText style={[styles.roomIconText, { color: C.primary }]}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View style={styles.content}>
        <AppText style={[styles.roomName, { color: C.text }]} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={[styles.agentsText, { color: C.muted }]} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View style={styles.avatarsRow}>
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                style={[
                  styles.avatar,
                  {
                    marginStart: i === 0 ? 0 : -9,
                    zIndex: 3 - i,
                    borderColor: C.surface,
                    backgroundColor: C.surface
                  },
                ]}
              >
                <View style={[StyleSheet.absoluteFill, { backgroundColor: color, opacity: 0.15 }]} />
                <AppText style={[styles.avatarText, { color }]}>
                  {(agent.name?.charAt(0) || '?').toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View
              style={[
                styles.avatarOverflow,
                {
                  borderColor: C.surface,
                  backgroundColor: C.surfaceHigh,
                },
              ]}
            >
              <AppText style={[styles.overflowText, { color: C.muted }]}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        style={[
          styles.manageButton,
          {
            backgroundColor: C.surfaceHigh,
            borderColor: C.border,
          },
        ]}
        accessibilityRole="button"
        accessibilityLabel={t('chat.manage_agents', { defaultValue: 'Manage agents' })}
      >
        <Ionicons name="person-add-outline" size={16} color={C.primary} />
      </ScalePressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.bubblePaddingH,
    paddingVertical: theme.spacing.bubblePaddingV,
    gap: theme.spacing.sm,
    borderBottomWidth: 1,
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    overflow: 'hidden',
  },
  roomIconText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  roomName: {
    fontSize: 16,
    fontWeight: '600',
  },
  agentsText: {
    fontSize: 11,
  },
  avatarsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  avatarOverflow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -9,
    zIndex: 0,
  },
  overflowText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  manageButton: {
    width: 32,
    height: 32,
    borderRadius: theme.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
