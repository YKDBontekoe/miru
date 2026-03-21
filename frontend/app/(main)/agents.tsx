import React, { useEffect } from 'react';
import { View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppCard } from '../../src/components/AppCard';
import { AppButton } from '../../src/components/AppButton';
import { useAgentStore } from '../../src/store/useAgentStore';
import { Agent } from '../../src/core/models';

export default function AgentsScreen() {
  const { agents, fetchAgents, isLoading } = useAgentStore();

  useEffect(() => {
    fetchAgents();
  }, [fetchAgents]);

  const renderAgentItem = ({ item }: { item: Agent }) => (
    <AppCard className="mb-md">
      <View className="flex-row items-center">
        <View
          className="w-12 h-12 rounded-full items-center justify-center mr-md"
          style={{ backgroundColor: `${getAgentColor(item.name)}20` }}
        >
          <AppText className="text-xl font-bold" style={{ color: getAgentColor(item.name) }}>
            {item.name[0].toUpperCase()}
          </AppText>
        </View>
        <View className="flex-1">
          <AppText variant="h3">{item.name}</AppText>
          <AppText variant="caption" color="muted" numberOfLines={1}>
            {item.personality}
          </AppText>
        </View>
        <View className="items-end">
          <AppText variant="caption" color="brand">
            Level {Math.floor(item.message_count / 10) + 1}
          </AppText>
        </View>
      </View>
    </AppCard>
  );

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-lg">
        <View className="py-lg">
          <AppText variant="h1">Agents</AppText>
          <AppText color="muted">Your AI personality collection</AppText>
        </View>

        <FlatList
          data={agents}
          renderItem={renderAgentItem}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={isLoading} onRefresh={fetchAgents} />}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-colossal">
              <AppText color="muted">No agents yet. Create your first one!</AppText>
              <AppButton
                label="Create Agent"
                variant="primary"
                className="mt-lg"
                onPress={() => {}} // TODO: Add creation flow
              />
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

function getAgentColor(name: string) {
  const palette = ['#3B82F6', '#14B8A6', '#EC4899', '#8B5CF6', '#F59E0B', '#10B981'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return palette[Math.abs(hash) % palette.length];
}
