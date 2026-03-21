import React, { useEffect } from 'react';
import { View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { AppText } from '../../src/components/AppText';
import { AppCard } from '../../src/components/AppCard';
import { useChatStore } from '../../src/store/useChatStore';
import { ChatRoom } from '../../src/core/models';

export default function ChatListScreen() {
  const router = useRouter();
  const { rooms, fetchRooms, isLoadingRooms, createRoom } = useChatStore();

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const renderRoomItem = ({ item }: { item: ChatRoom }) => (
    <AppCard className="mb-md" onTap={() => router.push(`/(main)/chat/${item.id}`)}>
      <View className="flex-row justify-between items-center">
        <View>
          <AppText variant="h3">{item.name}</AppText>
          <AppText variant="caption" color="muted">
            {new Date(item.created_at).toLocaleDateString()}
          </AppText>
        </View>
        <AppText color="brand" variant="bodySm">
          Open
        </AppText>
      </View>
    </AppCard>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-lg">
        <View className="flex-row justify-between items-center py-lg">
          <AppText variant="h1">Chats</AppText>
          <TouchableOpacity
            onPress={() => createRoom(`New Chat ${rooms.length + 1}`)}
            className="bg-primary w-8 h-8 rounded-full items-center justify-center"
          >
            <AppText className="text-white text-xl font-bold">+</AppText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={rooms}
          renderItem={renderRoomItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoadingRooms} onRefresh={fetchRooms} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-colossal">
              <AppText color="muted">No chats yet. Start a new one!</AppText>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
