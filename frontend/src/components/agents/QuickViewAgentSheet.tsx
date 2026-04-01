import React from 'react';
import { View, Pressable, Modal, Alert, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useColorScheme } from 'nativewind';
import { AppText } from '../AppText';
import { Agent } from '../../core/models';
import { ScalePressable } from '@/components/ScalePressable';
import { theme } from '../../core/theme';

interface QuickViewAgentSheetProps {
  agent: Agent;
  onClose: () => void;
  onAdd: (agentId: string) => Promise<void>;
  onRemove: (agentId: string) => Promise<void>;
  roomAgents: Agent[];
  getAgentColor: (name: string) => string;
}

export function QuickViewAgentSheet({
  agent,
  onClose,
  onAdd,
  onRemove,
  roomAgents,
  getAgentColor,
}: QuickViewAgentSheetProps) {
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';
  const color = getAgentColor(agent.name);
  const level = Math.floor(agent.message_count / 10) + 1;
  const isInRoom = roomAgents.some((a) => a.id === agent.id);

  const handleAdd = async () => {
    try {
      await onAdd(agent.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not add agent to chat. Please try again.');
    }
  };

  const handleRemove = async () => {
    try {
      await onRemove(agent.id);
      onClose();
    } catch {
      Alert.alert('Error', 'Could not remove agent from chat. Please try again.');
    }
  };

  return (
    <Modal visible animationType="none" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutDown.duration(180)}
          style={[
            styles.sheetContainer,
            { backgroundColor: isDark ? theme.colors.surface.dark : theme.colors.surface.light },
          ]}
          onStartShouldSetResponder={() => true}
        >
          {/* Drag handle */}
          <View style={styles.dragHandleContainer}>
            <View
              style={[
                styles.dragHandle,
                {
                  backgroundColor: isDark
                    ? theme.colors.surface.highestDark
                    : theme.colors.surface.highestLight,
                },
              ]}
            />
          </View>

          <View style={styles.headerRow}>
            <View
              style={[
                styles.avatarContainer,
                {
                  backgroundColor: `${color}18`,
                  borderColor: `${color}40`,
                },
              ]}
            >
              <AppText variant="h2" style={{ color, fontWeight: '700' }}>
                {agent.name[0]?.toUpperCase() ?? '?'}
              </AppText>
            </View>
            <View style={styles.headerTextContainer}>
              <AppText
                variant="h3"
                style={[
                  styles.agentName,
                  { color: isDark ? theme.colors.onSurface.dark : theme.colors.onSurface.light },
                ]}
              >
                {agent.name}
              </AppText>
              <View style={styles.statsRow}>
                <View style={[styles.levelBadge, { backgroundColor: `${color}18` }]}>
                  <AppText variant="caption" style={{ color, fontWeight: '700' }}>
                    Lv {level}
                  </AppText>
                </View>
                <AppText
                  variant="caption"
                  style={{
                    color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight,
                  }}
                >
                  {agent.message_count} messages
                </AppText>
              </View>
            </View>
          </View>

          <AppText
            variant="bodySm"
            style={[
              styles.personalityText,
              { color: isDark ? theme.colors.onSurface.mutedDark : theme.colors.onSurface.mutedLight },
            ]}
            numberOfLines={3}
          >
            {agent.personality}
          </AppText>

          {isInRoom ? (
            <ScalePressable
              onPress={handleRemove}
              style={[
                styles.actionButton,
                styles.removeButton,
                {
                  backgroundColor: isDark
                    ? theme.colors.status.errorSurfaceDark
                    : theme.colors.status.errorSurfaceLight,
                  borderColor: theme.colors.status.error,
                },
              ]}
            >
              <Ionicons
                name="person-remove-outline"
                size={16}
                color={theme.colors.status.error}
                style={styles.actionIcon}
              />
              <AppText style={[styles.actionText, { color: theme.colors.status.error }]}>
                Remove from Chat
              </AppText>
            </ScalePressable>
          ) : (
            <ScalePressable
              onPress={handleAdd}
              style={[
                styles.actionButton,
                { backgroundColor: theme.colors.primary.DEFAULT },
              ]}
            >
              <Ionicons
                name="person-add-outline"
                size={16}
                color={theme.colors.white}
                style={styles.actionIcon}
              />
              <AppText style={[styles.actionText, { color: theme.colors.white }]}>
                Add to Chat
              </AppText>
            </ScalePressable>
          )}
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)', // Keeps a subtle dark overlay even in light mode
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xxl,
  },
  dragHandleContainer: {
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  dragHandle: {
    width: 32,
    height: 4,
    borderRadius: theme.borderRadius.xs,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.spacing.lg,
  },
  avatarContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  agentName: {
    fontWeight: '700',
    marginBottom: theme.spacing.xxs,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  levelBadge: {
    borderRadius: theme.borderRadius.sm,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  personalityText: {
    lineHeight: 19,
    marginBottom: theme.spacing.xl,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: theme.borderRadius.md,
    paddingVertical: 13,
    marginBottom: theme.spacing.xxxl,
  },
  removeButton: {
    borderWidth: 1,
  },
  actionIcon: {
    marginEnd: theme.spacing.sm,
  },
  actionText: {
    fontWeight: '700',
    fontSize: 15, // Maintaining custom bold action text size
  },
});
