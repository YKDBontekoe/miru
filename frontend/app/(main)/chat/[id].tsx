import React, { useEffect, useState, useRef } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  View,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, Stack } from 'expo-router';
import { AppText } from '../../../src/components/AppText';
import { ChatBubble } from '../../../src/components/ChatBubble';
import { ChatInputBar } from '../../../src/components/ChatInputBar';
import { useChatStore } from '../../../src/store/useChatStore';
import { useAgentStore } from '../../../src/store/useAgentStore';
import { AppCard } from '../../../src/components/AppCard';

export default function ChatRoomScreen() {
  const { id: roomId } = useLocalSearchParams<{ id: string }>();
  const { messages, fetchMessages, sendMessage, isStreaming, rooms, addAgentToRoom } =
    useChatStore();
  const { agents, fetchAgents } = useAgentStore();
  const [inputText, setInputText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const roomMessages = messages[roomId || ''] || [];
  const room = rooms.find((r) => r.id === roomId);

  useEffect(() => {
    if (roomId) {
      fetchMessages(roomId);
      fetchAgents();
    }
  }, [roomId, fetchMessages, fetchAgents]);

  const handleSend = () => {
    if (inputText.trim() && roomId) {
      sendMessage(roomId, inputText.trim());
      setInputText('');
    }
  };

  const handleAddAgent = async (agentId: string) => {
    if (roomId) {
      await addAgentToRoom(roomId, agentId);
      setIsModalVisible(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <Stack.Screen
        options={{
          title: room?.name || 'Chat',
          headerShown: true,
          headerRight: () => (
            <TouchableOpacity onPress={() => setIsModalVisible(true)} className="mr-md">
              <AppText color="brand" variant="bodySm">
                Add Agent
              </AppText>
            </TouchableOpacity>
          ),
        }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        className="flex-1"
      >
        <FlatList
          ref={flatListRef}
          data={roomMessages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 16 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => (
            <ChatBubble
              text={item.content}
              isUser={!!item.user_id}
              status={item.status}
              agentName={item.agent_id ? 'Assistant' : undefined}
            />
          )}
        />

        <ChatInputBar
          value={inputText}
          onChangeText={setInputText}
          onSend={handleSend}
          isStreaming={isStreaming}
        />
      </KeyboardAvoidingView>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-surface-light dark:bg-surface-dark rounded-t-3xl p-xl h-3/4">
            <View className="flex-row justify-between items-center mb-xl">
              <AppText variant="h2">Add an Agent</AppText>
              <TouchableOpacity onPress={() => setIsModalVisible(false)}>
                <AppText color="muted">Close</AppText>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {agents.map((agent) => (
                <AppCard key={agent.id} className="mb-md" onTap={() => handleAddAgent(agent.id)}>
                  <AppText variant="h3">{agent.name}</AppText>
                  <AppText variant="caption" color="muted">
                    {agent.personality}
                  </AppText>
                </AppCard>
              ))}
              {agents.length === 0 && (
                <AppText color="muted" className="text-center mt-xl">
                  No agents available.
                </AppText>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
