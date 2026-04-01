import React from 'react';
import { View, ScrollView } from 'react-native';
import { HomeCard } from '../src/components/home/HomeCard';
import { HomeSectionHeader } from '../src/components/home/HomeSectionHeader';
import { HomeNewChatModal } from '../src/components/home/HomeNewChatModal';
import { HomeRecentChatRow } from '../src/components/home/HomeRecentChatRow';
import { HomeQuickAction } from '../src/components/home/HomeQuickAction';
import { QuickViewAgentSheet } from '../src/components/agents/QuickViewAgentSheet';
import { AppText } from '../src/components/AppText';
import { Agent } from '../src/core/models';

const mockAgent: Agent = {
  id: 'agent1',
  name: 'CodeReviewer',
  personality: 'I am extremely meticulous and helpful when it comes to refactoring clean code.',
  message_count: 42,
  created_at: new Date().toISOString(),
};

export default function TestLayout() {
  const [modalVisible, setModalVisible] = React.useState(false);
  const [agentVisible, setAgentVisible] = React.useState(true);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F8F8FC' }}>
      <View style={{ padding: 20, paddingTop: 60 }}>

        {/* Test HomeSectionHeader */}
        <HomeSectionHeader title="Recent Chats" actionLabel="View All" onAction={() => {}} />

        {/* Test HomeCard */}
        <HomeCard>
           <AppText variant="h3">This is a Premium HomeCard</AppText>
           <AppText variant="bodySm" color="muted">It has tokenized padding and elevation.</AppText>
        </HomeCard>

        {/* Test HomeRecentChatRow */}
        <HomeRecentChatRow
           room={{ id: '1', name: 'Refactoring React', created_at: new Date().toISOString(), updated_at: new Date(Date.now() - 5000).toISOString() }}
           onPress={() => setModalVisible(true)}
        />

        {/* Test HomeQuickAction */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <HomeQuickAction icon="chatbubbles-outline" label="New Chat" onPress={() => setModalVisible(true)} />
          <HomeQuickAction icon="bulb-outline" label="Idea" onPress={() => {}} />
        </View>

      </View>
      {/* Modals triggered automatically for UI display or hidden via state */}
      {modalVisible && (
        <HomeNewChatModal visible={modalVisible} onClose={() => setModalVisible(false)} onCreated={() => {}} />
      )}

      {agentVisible && (
        <QuickViewAgentSheet
          agent={mockAgent}
          roomAgents={[]}
          onClose={() => setAgentVisible(false)}
          onAdd={async () => {}}
          onRemove={async () => {}}
          getAgentColor={() => '#10B981'}
        />
      )}
    </ScrollView>
  );
}
