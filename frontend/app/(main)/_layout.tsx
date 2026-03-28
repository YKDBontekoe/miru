import { Tabs } from 'expo-router';
import { LiquidGlassTabBar } from '@/src/components/navigation/LiquidGlassTabBar';

export default function MainLayout() {
  return (
    <Tabs
      tabBar={(props) => <LiquidGlassTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="agents" options={{ title: 'Agents' }} />
      <Tabs.Screen name="productivity" options={{ title: 'Productivity' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      {/* Hide nested routes from tab bar */}
      <Tabs.Screen name="chat/[id]" options={{ href: null }} />
    </Tabs>
  );
}
