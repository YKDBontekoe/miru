import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';
import { theme } from '@/core/theme';

const C = {
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  primary: DESIGN_TOKENS.colors.primary,
};

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

  return (
    <View style={[styles.container, { borderColor: DESIGN_TOKENS.colors.border, backgroundColor: DESIGN_TOKENS.colors.surface }]}>
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.back', { defaultValue: 'Back' })}
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View style={[styles.roomIcon, { backgroundColor: DESIGN_TOKENS.colors.primarySoft, borderColor: DESIGN_TOKENS.colors.border }]}>
        <AppText style={[styles.roomIconText, { color: C.primary }]}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View style={styles.titleContainer}>
        <AppText style={[styles.titleText, { color: C.text }]} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={[styles.agentsSubtitle, { color: C.muted }]} numberOfLines={1}>
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
                    borderColor: DESIGN_TOKENS.colors.surface,
                    backgroundColor: `${color}22`,
                    marginStart: i === 0 ? 0 : -9,
                    zIndex: 3 - i,
                  },
                ]}
              >
                <AppText style={[styles.avatarText, { color }]}>
                  {(agent.name?.charAt(0) || '?').toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View
              style={[
                styles.avatarMore,
                {
                  borderColor: DESIGN_TOKENS.colors.surface,
                  backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
                },
              ]}
            >
              <AppText style={[styles.avatarMoreText, { color: C.muted }]}>
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
            backgroundColor: DESIGN_TOKENS.colors.surfaceSoft,
            borderColor: DESIGN_TOKENS.colors.border,
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
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
  },
  roomIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  roomIconText: {
    fontWeight: 'bold',
    fontSize: theme.typography.body.fontSize,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: theme.typography.body.fontSize,
    fontWeight: '600',
  },
  agentsSubtitle: {
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
  },
  avatarText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  avatarMore: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginStart: -9,
    zIndex: 0,
  },
  avatarMoreText: {
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
