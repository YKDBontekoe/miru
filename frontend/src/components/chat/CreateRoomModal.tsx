import React, { useState, useCallback } from 'react';
import { View, Modal, TextInput, Alert, ActivityIndicator, FlatList } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { AppText } from '@/components/AppText';
import { ScalePressable } from '@/components/ScalePressable';
import { Agent } from '@/core/models';
import { useChatStore } from '@/store/useChatStore';
import { getAgentColor } from '@/utils/colors';

const C = {
  surface: '#FFFFFF',
  surfaceHigh: '#EEF2FF',
  text: '#0A0E2E',
  muted: '#606490',
  faint: '#B4BBDE',
  primary: '#2563EB',
};

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
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: selected ? `${color}12` : C.surfaceHigh,
              borderRadius: 16,
              padding: 12,
              marginBottom: 8,
            }}
          >
            <View
              style={{
                width: 36,
                height: 36,
                borderRadius: 18,
                backgroundColor: `${color}18`,
                alignItems: 'center',
                justifyContent: 'center',
                marginEnd: 12,
              }}
            >
              <AppText style={{ color, fontWeight: '700' }}>{agent.name[0].toUpperCase()}</AppText>
            </View>
            <View style={{ flex: 1 }}>
              <AppText style={{ fontSize: 14, fontWeight: '600', color: C.text }}>
                {agent.name}
              </AppText>
              <AppText variant="caption" style={{ color: C.muted }} numberOfLines={1}>
                {agent.personality}
              </AppText>
            </View>
            {selected && <Ionicons name="checkmark-circle" size={20} color={color} />}
          </ScalePressable>
        );
      },
      [selectedAgentIds, toggleAgent]
    );

    const handleCreate = async () => {
      if (!name.trim()) {
        Alert.alert(
          t('chat.name_required', 'Name required'),
          t('chat.please_enter_name', 'Please enter a name for this chat.')
        );
        return;
      }
      setIsSaving(true);
      try {
        const room = await createRoom(name.trim());
        for (const agentId of selectedAgentIds) {
          await addAgentToRoom(room.id, agentId);
        }
        setName('');
        setSelectedAgentIds([]);
        onCreated();
        onClose();
      } catch {
        Alert.alert(
          t('chat.error', 'Error'),
          t('chat.failed_to_create', 'Failed to create chat. Please try again.')
        );
      } finally {
        setIsSaving(false);
      }
    };

    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' }}>
          <View
            style={{
              backgroundColor: C.surface,
              borderTopLeftRadius: 28,
              borderTopRightRadius: 28,
              padding: 24,
              maxHeight: '82%',
            }}
          >
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <AppText variant="h2" style={{ color: C.text }}>
                New Chat
              </AppText>
              <ScalePressable onPress={onClose}>
                <Ionicons name="close-circle" size={26} color={C.faint} />
              </ScalePressable>
            </View>

            <AppText
              variant="caption"
              style={{
                color: C.muted,
                marginBottom: 8,
                textTransform: 'uppercase',
                letterSpacing: 1,
              }}
            >
              Chat Name
            </AppText>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Gaming Session"
              placeholderTextColor={C.faint}
              style={{
                backgroundColor: C.surfaceHigh,
                borderRadius: 16,
                paddingHorizontal: 14,
                paddingVertical: 12,
                color: C.text,
                fontSize: 16,
                marginBottom: 20,
              }}
            />

            {agents.length > 0 && (
              <>
                <AppText
                  variant="caption"
                  style={{
                    color: C.muted,
                    marginBottom: 10,
                    textTransform: 'uppercase',
                    letterSpacing: 1,
                  }}
                >
                  Add Agents
                </AppText>
                <FlatList
                  data={agents}
                  keyExtractor={(item) => item.id}
                  renderItem={renderAgentItem}
                  showsVerticalScrollIndicator={false}
                  style={{ maxHeight: 180 }}
                />
              </>
            )}

            <ScalePressable
              onPress={handleCreate}
              disabled={isSaving}
              style={{
                backgroundColor: isSaving ? `${C.primary}80` : C.primary,
                borderRadius: 18,
                paddingVertical: 15,
                alignItems: 'center',
                marginTop: 20,
                shadowColor: C.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.25,
                shadowRadius: 10,
                elevation: 4,
              }}
            >
              {isSaving ? (
                <ActivityIndicator color="white" />
              ) : (
                <AppText style={{ color: 'white', fontWeight: '700', fontSize: 16 }}>
                  Create Chat
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
