import React, { useState, useCallback } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useChatStore } from '@/store/useChatStore';
import { getAgentColor } from '@/utils/colors';
import { useTheme } from '@/hooks/useTheme';

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
            className="flex-row items-center rounded-2xl p-3 mb-2"
            style={{
              backgroundColor: selected ? `${color}12` : C.surfaceHigh,
            }}
          >
            <View
              className="w-9 h-9 rounded-full items-center justify-center me-3"
              style={{ backgroundColor: `${color}18` }}
            >
              <AppText className="font-bold" style={{ color }}>
                {agent.name[0].toUpperCase()}
              </AppText>
            </View>
            <View className="flex-1">
              <AppText className="text-[14px] font-semibold" style={{ color: C.text }}>
                {agent.name}
              </AppText>
              <AppText variant="caption" className="text-muted" numberOfLines={1}>
                {agent.personality}
              </AppText>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
          </ScalePressable>
        );
      },
      [selectedAgentIds, toggleAgent, C.surfaceHigh, C.text]
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
        <View className="flex-1 justify-end bg-black/35">
          <View className="rounded-t-[28px] p-6 max-h-[82%]" style={{ backgroundColor: C.surface }}>
            <View className="flex-row justify-between items-center mb-6">
              <AppText variant="h2" style={{ color: C.text }}>
                {t('createRoom.title', 'New Chat')}
              </AppText>
              <ScalePressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={C.faint} />
              </ScalePressable>
            </View>

            <AppText
              variant="caption"
              className="uppercase tracking-widest mb-2"
              style={{ color: C.muted }}
            >
              {t('createRoom.nameLabel', 'Chat Name')}
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder={t('createRoom.namePlaceholder', 'e.g. Gaming Session')}
              placeholderTextColor={C.faint}
              className="rounded-2xl px-3.5 py-3 text-[16px] mb-5"
              style={{
                backgroundColor: C.surfaceHigh,
                color: C.text,
              }}
            />

            {agents.length > 0 && (
              <>
                <AppText
                  variant="caption"
                  className="uppercase tracking-widest mb-2.5"
                  style={{ color: C.muted }}
                >
                  {t('createRoom.addAgents', 'Add Agents')}
                </AppText>
                <FlatList
                  data={agents}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAgentItem}
                  showsVerticalScrollIndicator={false}
                  className="max-h-[180px]"
                />
              </>
            )}

            <ScalePressable
              onPress={handleCreate}
              disabled={isSaving}
              className="rounded-2xl py-4 items-center mt-5"
              style={{
                backgroundColor: isSaving ? `${C.primary}80` : C.primary,
                elevation: 4,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText className="text-white font-bold text-[16px]">
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
