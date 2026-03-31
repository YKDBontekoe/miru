import React, { useState, useEffect } from 'react';
import { View, Modal, ScrollView, Alert } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAgentStore } from '../../store/useAgentStore';
import { useChatStore } from '../../store/useChatStore';
import { haptic } from '../../utils/haptics';
import { Agent } from '../../core/models';
import { getAgentColor, getMoodEmoji, MILESTONES } from './agentUtils';
import { AgentDetailHeader, AgentDetailView, AgentDetailEditForm } from './details';

interface AgentDetailSheetProps {
  agent: Agent | null;
  visible: boolean;
  onClose: () => void;
  onDeleted: (agent: Agent) => void;
  onUpdated: (updated: Agent) => void;
}

export function AgentDetailSheet({
  agent,
  visible,
  onClose,
  onDeleted,
  onUpdated,
}: AgentDetailSheetProps) {
  const { C } = useTheme();
  const router = useRouter();
  const { updateAgent } = useAgentStore();
  const { createRoom, addAgentToRoom } = useChatStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPersonality, setEditPersonality] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isStartingChat, setIsStartingChat] = useState(false);

  useEffect(() => {
    if (agent) {
      setEditName(agent.name);
      setEditPersonality(agent.personality);
      setEditDescription(agent.description ?? '');
      setEditGoals(agent.goals ?? []);
      setIsEditing(false);
    }
  }, [agent]);

  if (!agent) return null;

  const displayColor = getAgentColor(agent.name);
  const moodEmoji = getMoodEmoji(agent.mood);

  const level = Math.floor(agent.message_count / 10) + 1;
  const xpProgress = (agent.message_count % 10) / 10;

  const handleSaveEdit = async () => {
    if (!editName.trim() || !editPersonality.trim()) {
      Alert.alert('Required Fields', 'Name and personality are required.');
      return;
    }
    haptic.light();
    setIsSaving(true);
    try {
      const updated = await updateAgent(agent.id, {
        name: editName.trim(),
        personality: editPersonality.trim(),
        description: editDescription.trim(),
        goals: editGoals,
      });
      if (updated) {
        onUpdated(updated);
        setIsEditing(false);
      }
    } catch (e: any) {
      Alert.alert('Update Failed', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const cancelEdit = () => {
    haptic.selection();
    setEditName(agent.name);
    setEditPersonality(agent.personality);
    setEditDescription(agent.description ?? '');
    setEditGoals(agent.goals ?? []);
    setIsEditing(false);
  };

  const handleStartChat = async () => {
    haptic.light();
    setIsStartingChat(true);
    try {
      const room = await createRoom(`Chat with ${agent.name}`);
      await addAgentToRoom(room.id, agent.id);
      onClose();
      router.push(`/chat/${room.id}`);
    } catch (e: any) {
      Alert.alert('Could not start chat', e.message);
    } finally {
      setIsStartingChat(false);
    }
  };

  let affinityPct = Math.min(Number(agent.message_count), 100);
  let affinityLabel = 'Acquaintance';
  if (agent.message_count > 100) affinityLabel = 'Trusted Friend';
  else if (agent.message_count > 50) affinityLabel = 'Good Friend';
  else if (agent.message_count > 20) affinityLabel = 'Friend';

  const nextMilestone = MILESTONES.find((m) => m.threshold > agent.message_count);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' }}>
        <Animated.View
          entering={SlideInUp.duration(300)}
          exiting={SlideOutDown.duration(200)}
          style={{
            backgroundColor: C.surface,
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '92%',
          }}
        >
          <View style={{ alignItems: 'center', paddingTop: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: C.faint }} />
          </View>

          <AgentDetailHeader
            agent={agent}
            isEditing={isEditing}
            editName={editName}
            setEditName={setEditName}
            displayColor={displayColor}
            moodEmoji={moodEmoji}
            level={level}
            xpProgress={xpProgress}
            onEditToggle={() => {
              haptic.light();
              setIsEditing(true);
            }}
            onCancelEdit={cancelEdit}
            onClose={onClose}
          />

          <ScrollView style={{ padding: 20 }} showsVerticalScrollIndicator={false}>
            {isEditing ? (
              <AgentDetailEditForm
                agent={agent}
                editPersonality={editPersonality}
                setEditPersonality={setEditPersonality}
                editDescription={editDescription}
                setEditDescription={setEditDescription}
                editGoals={editGoals}
                setEditGoals={setEditGoals}
                isSaving={isSaving}
                onSave={handleSaveEdit}
                onClose={onClose}
                onDeleted={onDeleted}
              />
            ) : (
              <AgentDetailView
                agent={agent}
                level={level}
                displayColor={displayColor}
                affinityPct={affinityPct}
                affinityLabel={affinityLabel}
                nextMilestone={nextMilestone}
                isStartingChat={isStartingChat}
                onStartChat={handleStartChat}
              />
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}
