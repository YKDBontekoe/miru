import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform, View } from 'react-native';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

function TabIcon({
  name,
  activeName,
  color,
  focused,
  size,
}: {
  name: IoniconsName;
  activeName: IoniconsName;
  color: string;
  focused: boolean;
  size: number;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={focused ? activeName : name} size={size} color={color} />
    </View>
  );
}

export default function MainLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#E0E0EC',
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 24 : 10,
          height: Platform.OS === 'ios' ? 84 : 66,
        },
        tabBarActiveTintColor: '#2563EB',
        tabBarInactiveTintColor: '#A0A0B4',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="home-outline"
              activeName="home"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="chatbubbles-outline"
              activeName="chatbubbles"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="agents"
        options={{
          title: 'Agents',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="people-outline"
              activeName="people"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="productivity"
        options={{
          title: 'Productivity',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="checkmark-circle-outline"
              activeName="checkmark-circle"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused, size }) => (
            <TabIcon
              name="settings-outline"
              activeName="settings"
              color={color}
              focused={focused}
              size={size}
            />
          ),
        }}
      />
      {/* Hide nested routes from tab bar */}
      <Tabs.Screen name="chat/[id]" options={{ href: null }} />
      <Tabs.Screen name="search" options={{ href: null }} />
    </Tabs>
  );
}
