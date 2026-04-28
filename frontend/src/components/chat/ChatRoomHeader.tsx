import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { DESIGN_TOKENS } from '@/core/design/tokens';


const C = {
  surfaceHigh: DESIGN_TOKENS.colors.surfaceSoft,
  text: DESIGN_TOKENS.colors.text,
  muted: DESIGN_TOKENS.colors.muted,
  primary: DESIGN_TOKENS.colors.primary,
  primarySoft: DESIGN_TOKENS.colors.primarySoft,
  border: DESIGN_TOKENS.colors.border,
  white: DESIGN_TOKENS.colors.white,
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
    <View style={styles.container}>
      <ScalePressable
        onPress={onBack}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel={t('chat.back', { defaultValue: 'Back' })}
      >
        <Ionicons name="chevron-back" size={26} color={C.text} />
      </ScalePressable>

      <View style={styles.roomInitialContainer}>
        <AppText style={[styles.roomInitialText, { color: C.primary }]}>
          {(room?.name?.charAt(0) || '?').toUpperCase()}
        </AppText>
      </View>

      <View style={styles.titleContainer}>
        <AppText style={[styles.titleText, { color: C.text }]} numberOfLines={1}>
          {room?.name ?? 'Chat'}
        </AppText>
        {roomAgents.length > 0 && (
          <AppText style={[styles.subtitleText, { color: C.muted }]} numberOfLines={1}>
            {roomAgents.map((a) => a.name).join(', ')}
          </AppText>
        )}
      </View>

      {/* Tappable agent avatars row */}
      {roomAgents.length > 0 && (
        <View style={styles.avatarsContainer}>
          {roomAgents.slice(0, 3).map((agent, i) => {
            const color = getAgentColor(agent.name);
            return (
              <ScalePressable
                key={agent.id}
                onPress={() => onQuickViewAgent(agent)}
                style={[
                  styles.avatar,
                  {
                    backgroundColor: `${color}22`,
                    marginStart: i === 0 ? 0 : -9,
                    zIndex: 3 - i,
                  },
                ]}
              >
                <AppText style={[styles.avatarInitial, { color }]}>
                  {(agent.name?.charAt(0) || '?').toUpperCase()}
                </AppText>
              </ScalePressable>
            );
          })}
          {roomAgents.length > 3 && (
            <View
              style={[
                styles.avatar,
                styles.moreAvatars,
                { zIndex: 0 },
              ]}
            >
              <AppText style={[styles.moreAvatarsText, { color: C.muted }]}>
                +{roomAgents.length - 3}
              </AppText>
            </View>
          )}
        </View>
      )}

      <ScalePressable
        onPress={onManageAgentsPress}
        style={styles.manageAgentsButton}
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
    borderBottomColor: C.border,
    backgroundColor: C.white,
  },
  roomInitialContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.primarySoft,
    borderWidth: 1,
    borderColor: `${C.primary}55`,
  },
  roomInitialText: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  titleContainer: {
    flex: 1,
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
  },
  subtitleText: {
    fontSize: 11,
  },
  avatarsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  moreAvatars: {
    backgroundColor: C.surfaceHigh,
    marginStart: -9,
  },
  moreAvatarsText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  manageAgentsButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: C.surfaceHigh,
    borderWidth: 1,
    borderColor: C.border,
  },
});
