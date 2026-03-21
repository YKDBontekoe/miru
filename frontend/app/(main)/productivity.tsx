import React, { useEffect, useState } from 'react';
import { View, FlatList, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText } from '../../src/components/AppText';
import { AppCard } from '../../src/components/AppCard';
import { useProductivityStore } from '../../src/store/useProductivityStore';

export default function ProductivityScreen() {
  const [activeTab, setActiveTab] = useState<'notes' | 'tasks'>('notes');
  const { notes, tasks, fetchNotes, fetchTasks, isLoading } = useProductivityStore();

  useEffect(() => {
    if (activeTab === 'notes') fetchNotes();
    else fetchTasks();
  }, [activeTab, fetchNotes, fetchTasks]);

  return (
    <SafeAreaView className="flex-1 bg-background-light dark:bg-background-dark">
      <View className="flex-1 px-lg">
        <View className="py-lg">
          <AppText variant="h1">Productivity</AppText>
        </View>

        {/* Tab Switcher */}
        <View className="flex-row bg-surface-highLight dark:bg-surface-highDark rounded-lg p-xxs mb-lg">
          <TouchableOpacity
            onPress={() => setActiveTab('notes')}
            className={`flex-1 py-sm items-center rounded-md ${activeTab === 'notes' ? 'bg-surface-light dark:bg-surface-dark shadow-sm' : ''}`}
          >
            <AppText className={activeTab === 'notes' ? 'font-bold' : ''}>Notes</AppText>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setActiveTab('tasks')}
            className={`flex-1 py-sm items-center rounded-md ${activeTab === 'tasks' ? 'bg-surface-light dark:bg-surface-dark shadow-sm' : ''}`}
          >
            <AppText className={activeTab === 'tasks' ? 'font-bold' : ''}>Tasks</AppText>
          </TouchableOpacity>
        </View>

        <FlatList
          data={activeTab === 'notes' ? (notes as any[]) : (tasks as any[])}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={activeTab === 'notes' ? fetchNotes : fetchTasks}
            />
          }
          renderItem={({ item }) => (
            <AppCard className="mb-md">
              <AppText variant="h3">{item.title}</AppText>
              {'content' in item && (
                <AppText variant="caption" color="muted" numberOfLines={2} className="mt-xs">
                  {item.content}
                </AppText>
              )}
              {'completed' in item && (
                <View className="flex-row items-center mt-xs">
                  <View
                    className={`w-3 h-3 rounded-full mr-xs ${item.completed ? 'bg-status-success' : 'bg-status-warning'}`}
                  />
                  <AppText variant="caption" color="muted">
                    {item.completed ? 'Completed' : 'In Progress'}
                  </AppText>
                </View>
              )}
            </AppCard>
          )}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center mt-colossal">
              <AppText color="muted">Nothing here yet.</AppText>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}
