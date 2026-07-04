import React, { useState, useEffect } from 'react';
import { View, Modal, ScrollView, Alert } from 'react-native';
import Animated, { SlideInUp, SlideOutDown } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { useTheme } from '../../hooks/useTheme';
import { useAgentStore } from '../../store/useAgentStore';
import { useChatStore } from '../../store/useChatStore';
import { haptic } from '../../utils/haptics';
import { Ionicons } from '@expo/vector-icons';
import { AppText } from '../../components/AppText';
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
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    if (successVisible) {
      timeoutId = setTimeout(() => {
        setSuccessVisible(false);
        setIsEditing(false);
      }, 1500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [successVisible]);

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
      setErrorMsg('Name and personality are required.');
      return;
    }

    Alert.alert(
      `Save changes to "${agent.name}"?`,
      'Are you sure you want to save these changes?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Save',
          onPress: async () => {
            setErrorMsg('');
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
                haptic.success();
                setSuccessVisible(true);
              }
            } catch (e: any) {
              setErrorMsg(e.message);
              haptic.error();
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  };

  const cancelEdit = () => {
    haptic.selection();
    setErrorMsg('');
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
                errorMsg={errorMsg}
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

        {successVisible && (
          <View style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: 'rgba(0,0,0,0.5)',
            zIndex: 1000
          }}>
            <View style={{ backgroundColor: C.surface, padding: 20, borderRadius: 16, alignItems: 'center' }}>
               <Ionicons name="checkmark-circle" size={48} color={C.success} />
               <AppText style={{ marginTop: 12, fontSize: 18, fontWeight: 'bold', color: C.text }}>Persona updated</AppText>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}
