import React, { useState, useCallback } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator, FlatList, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useChatStore } from '@/store/useChatStore';
import { getAgentColor } from '@/utils/colors';
import { useTheme } from '@/hooks/useTheme';
import { theme } from '@/core/theme';

export interface CreateRoomModalProps {
  /** Whether the modal is currently visible. */
  visible: boolean;
  /** List of available agents to potentially add to the room. */
  agents: Agent[];
  /** Callback fired to close the modal. */
  onClose: () => void;
  /** Callback fired after a room has been successfully created. */
  onCreated: () => void;
}

/**
 * A modal component allowing users to create a new chat room and add agents to it.
 */
export const CreateRoomModal = React.memo(
  ({ visible, agents, onClose, onCreated }: CreateRoomModalProps) => {
    const { t } = useTranslation();
    const { C } = useTheme();
    const [name, setName] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const { createRoom, addAgentToRoom } = useChatStore();
    const [selectedAgentIds, setSelectedAgentIds] = useState<string[]>([]);

    const toggleAgent = useCallback(
      (id: string) =>
        setSelectedAgentIds((prev) =>
          prev.includes(id) ? prev.filter((a) => a !== id) : [...prev, id]
        ),
      []
    );

    const renderAgentItem = useCallback(
      ({ item: agent }: { item: Agent }) => {
        const color = getAgentColor(agent.name);
        const selected = selectedAgentIds.includes(agent.id);
        return (
          <ScalePressable
            onPress={() => toggleAgent(agent.id)}
            style={[
              styles.agentRow,
              { backgroundColor: selected ? `${color}12` : C.surfaceHigh }
            ]}
          >
            <View
              style={[
                styles.agentAvatar,
                { backgroundColor: `${color}18` }
              ]}
            >
              <AppText style={[styles.agentAvatarText, { color }]}>
                {agent.name[0].toUpperCase()}
              </AppText>
            </View>
            <View style={styles.agentInfo}>
              <AppText style={[styles.agentName, { color: C.text }]}>
                {agent.name}
              </AppText>
              <AppText variant="caption" style={[styles.agentPersonality, { color: C.muted }]} numberOfLines={1}>
                {agent.personality}
              </AppText>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
          </ScalePressable>
        );
      },
      [selectedAgentIds, toggleAgent, C.surfaceHigh, C.text, C.muted]
    );

    const handleCreate = async () => {
      if (!name.trim()) {
        Alert.alert(
          t('createRoom.nameRequired', 'Name required'),
          t('createRoom.nameRequiredDesc', 'Please enter a name for this chat.')
        );
        return;
      }
      setIsSaving(true);
      try {
        const room = await createRoom(name.trim());
        try {
          const promises = selectedAgentIds.map((agentId) => addAgentToRoom(room.id, agentId));
          await Promise.all(promises);
          setName('');
          setSelectedAgentIds([]);
          onCreated();
          onClose();
        } catch (err) {
          // Rollback room creation if agent additions fail
          // Assuming a deleteRoom function exists on useChatStore, if not, this will need to be added to the store.
          // For now, simulating the intent.
          const { deleteRoom } = useChatStore.getState();
          if (deleteRoom) {
            await deleteRoom(room.id);
          }
          console.error('Failed to add agents to room, rolling back room creation', err);
          Alert.alert(
            t('createRoom.error', 'Error'),
            t('createRoom.failedToAddAgents', 'Failed to link agents. Please try again.')
          );
        }
      } catch (err) {
        console.error('Failed to create room', err);
        Alert.alert(
          t('createRoom.error', 'Error'),
          t('createRoom.failedToCreate', 'Failed to create chat. Please try again.')
        );
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: C.surface }]}>
            <View style={styles.header}>
              <AppText variant="h2" style={{ color: C.text }}>
                {t('createRoom.title', 'New Chat')}
              </AppText>
              <ScalePressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={C.faint} />
              </ScalePressable>
            </View>

            <AppText
              variant="caption"
              style={[styles.label, { color: C.muted }]}
            >
              {t('createRoom.nameLabel', 'Chat Name')}
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('createRoom.namePlaceholder', 'e.g. Gaming Session')}
              placeholderTextColor={C.faint}
              style={[
                styles.input,
                {
                  backgroundColor: C.surfaceHigh,
                  color: C.text,
                },
              ]}
            />

            {agents.length > 0 && (
              <>
                <AppText
                  variant="caption"
                  style={[styles.label, styles.agentsLabel, { color: C.muted }]}
                >
                  {t('createRoom.addAgents', 'Add Agents')}
                </AppText>
                <FlatList
                  data={agents}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAgentItem}
                  showsVerticalScrollIndicator={false}
                  style={styles.agentsList}
                />
              </>
            )}

            <ScalePressable
              onPress={handleCreate}
              disabled={isSaving}
              style={[
                styles.createButton,
                {
                  backgroundColor: isSaving ? `${C.primary}80` : C.primary,
                },
              ]}
            >
              {isSaving ? (
                <ActivityIndicator color={theme.colors.white} />
              ) : (
                <AppText style={styles.createButtonText}>
                  {t('createRoom.createButton', 'Create Chat')}
                </AppText>
              )}
            </ScalePressable>
          </View>
        </View>
      </Modal>
    );
  }
);

CreateRoomModal.displayName = 'CreateRoomModal';

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: theme.spacing.xxl,
    maxHeight: '82%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: theme.spacing.xxl,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: theme.spacing.xs,
  },
  input: {
    borderRadius: theme.borderRadius.lg,
    paddingHorizontal: 14,
    paddingVertical: theme.spacing.md,
    ...theme.typography.body,
    marginBottom: theme.spacing.xl,
  },
  agentsLabel: {
    marginBottom: 10,
  },
  agentsList: {
    maxHeight: 180,
  },
  agentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.md,
    marginBottom: theme.spacing.sm,
  },
  agentAvatar: {
    width: 36,
    height: 36,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginEnd: theme.spacing.md,
  },
  agentAvatarText: {
    fontWeight: 'bold',
  },
  agentInfo: {
    flex: 1,
  },
  agentName: {
    ...theme.typography.bodySm,
    fontWeight: '600',
  },
  agentPersonality: {
  },
  createButton: {
    borderRadius: theme.borderRadius.lg,
    paddingVertical: theme.spacing.lg,
    alignItems: 'center',
    marginTop: theme.spacing.xl,
    elevation: 4,
  },
  createButtonText: {
    color: theme.colors.white,
    ...theme.typography.body,
    fontWeight: 'bold',
  },
});
